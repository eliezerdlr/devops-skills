"""Synthetic offline tests: no real home, credentials, API, or network access."""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest import mock

SPEC = importlib.util.spec_from_file_location('configure', Path(__file__).parents[1] / 'configure.py')
setup = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup)
URL = 'https://vpn.example.com/api'
TOKEN = 'synthetic-token-123'


class ConfigureTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.profile = self.root / 'profile'

    def run_setup(self, **kwargs):
        options = {'token_supplier': lambda: TOKEN}
        options.update(kwargs)
        setup.configure(self.profile, URL, **options)

    def seed(self):
        self.run_setup()

    def test_url_normalization(self):
        for suffix in ('', '/', '/api', '/api/'):
            self.assertEqual(setup.normalize_url('https://vpn.example.com' + suffix), URL)
        self.assertEqual(setup.normalize_url('https://vpn.example.com:443/'),
                         'https://vpn.example.com:443/api')

    def test_invalid_urls_have_generic_errors(self):
        urls = ['http://vpn.example.com', 'https://user:secret@example.com',
                'https://vpn.example.com/?secret', 'https://vpn.example.com/#secret',
                'https://vpn.example.com/other', 'https://vpn.example.com:0',
                'https://vpn.example.com:65536', 'https://vpn.example.com:abc',
                'https://vpn.example.com:', 'https://é.example.com',
                'https://vpn.example.com /', 'https://vpn.example.com\n',
                'https://bad_host.example.com', 'https://vpn.example.com\\other',
                'https://vpn.example.com%', 'https:///api', 'https://[::1]suffix']
        for url in urls:
            with self.subTest(url=url), self.assertRaises(setup.ConfigurationError) as error:
                setup.normalize_url(url)
            self.assertEqual(str(error.exception), 'Invalid API URL.')
        self.assertFalse(self.profile.exists())

    def test_new_files_private_and_exact_schema(self):
        self.seed()
        self.assertEqual(stat.S_IMODE(self.profile.stat().st_mode), 0o700)
        for name in ('config.json', 'api.token'):
            info = (self.profile / name).stat()
            self.assertEqual(stat.S_IMODE(info.st_mode), 0o600)
            self.assertEqual(info.st_nlink, 1)
        self.assertEqual(json.loads((self.profile / 'config.json').read_text()),
                         {'apiUrl': URL, 'allowWrites': False})
        self.assertEqual((self.profile / 'api.token').read_text(), TOKEN)

    def test_reuse_does_not_read_token_or_call_supplier_and_is_idempotent(self):
        self.seed()
        before = {p.name: p.stat().st_ino for p in self.profile.iterdir()}
        supplier = mock.Mock(side_effect=AssertionError('must not prompt'))
        original_open = os.open
        def guarded_open(path, *args, **kwargs):
            self.assertNotEqual(Path(path).name, 'api.token')
            return original_open(path, *args, **kwargs)
        with mock.patch.object(setup.os, 'open', side_effect=guarded_open):
            self.run_setup(token_supplier=supplier)
        supplier.assert_not_called()
        self.assertEqual(before, {p.name: p.stat().st_ino for p in self.profile.iterdir()})

    def test_existing_token_metadata_limit_without_reading(self):
        self.seed()
        token_path = self.profile / 'api.token'
        token_path.write_bytes(b'x' * 16384)
        self.run_setup(token_supplier=None)
        token_path.write_bytes(b'x' * 16385)
        with self.assertRaises(setup.ConfigurationError):
            self.run_setup(token_supplier=None)

    def test_missing_config_reuses_existing_token(self):
        self.seed()
        (self.profile / 'config.json').unlink()
        self.run_setup(token_supplier=None)
        self.assertTrue((self.profile / 'config.json').exists())

    def test_cli_simulated_terminal_prompts(self):
        with mock.patch.object(setup, 'input', return_value=URL, create=True), \
                mock.patch.object(setup, 'terminal_token', return_value=TOKEN):
            code, output = self.cli([], tty=True)
        self.assertEqual(code, 0)
        self.assertNotIn(TOKEN, output)
        self.assertEqual((self.root / '.netbird-pi' / 'api.token').read_text(), TOKEN)

    def test_read_only_secure_files_reused(self):
        self.seed()
        for file in self.profile.iterdir():
            file.chmod(0o400)
        self.run_setup(token_supplier=None)

    def test_explicit_update_and_rotation(self):
        self.seed()
        with self.assertRaises(setup.ConfigurationError):
            self.run_setup(allow_writes=True)
        self.run_setup(allow_writes=True, update_config=True)
        self.assertTrue(json.loads((self.profile / 'config.json').read_text())['allowWrites'])
        self.run_setup(allow_writes=True, replace_token=True, token_supplier=lambda: 'rotated-synthetic')
        self.assertEqual((self.profile / 'api.token').read_text(), 'rotated-synthetic')

    def test_invalid_tokens_leave_no_side_effects(self):
        for token in ('short', 'has space', 'newline\n', 'é' * 8, 'x' * 8193, None):
            with self.subTest(length=len(token) if token else 0):
                with self.assertRaises(setup.ConfigurationError) as error:
                    self.run_setup(token_supplier=lambda: token)
                self.assertEqual(str(error.exception), 'Invalid token format.')
                self.assertFalse(self.profile.exists())
        self.assertEqual(len(setup.validate_token('x' * 8192)), 8192)

    def test_invalid_rotation_preserves_existing_files(self):
        self.seed()
        before = {p.name: p.read_bytes() for p in self.profile.iterdir()}
        with self.assertRaises(setup.ConfigurationError):
            self.run_setup(replace_token=True, update_config=True, allow_writes=True,
                           token_supplier=lambda: 'bad')
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.profile.iterdir()})

    def test_missing_supplier_creates_nothing(self):
        with self.assertRaises(setup.ConfigurationError):
            self.run_setup(token_supplier=None)
        self.assertFalse(self.profile.exists())

    def test_weak_directory_permissions_not_repaired(self):
        self.profile.mkdir(mode=0o755)
        with self.assertRaises(setup.ConfigurationError):
            self.seed()
        self.assertEqual(stat.S_IMODE(self.profile.stat().st_mode), 0o755)
        self.assertEqual(list(self.profile.iterdir()), [])

    def test_profile_symlink_rejected(self):
        target = self.root / 'target'
        target.mkdir(mode=0o700)
        self.profile.symlink_to(target, target_is_directory=True)
        with self.assertRaises(setup.ConfigurationError):
            self.seed()
        self.assertEqual(list(target.iterdir()), [])

    def test_unsafe_files(self):
        for name in ('api.token', 'config.json'):
            for kind in ('weak', 'symlink', 'hardlink', 'fifo', 'empty', 'oversize'):
                with self.subTest(name=name, kind=kind):
                    with tempfile.TemporaryDirectory(dir=self.root) as tmp:
                        profile = Path(tmp)
                        target = profile / name
                        if kind == 'symlink':
                            other = profile / 'other'
                            other.write_text(TOKEN)
                            other.chmod(0o600)
                            target.symlink_to(other)
                        elif kind == 'fifo':
                            os.mkfifo(target, 0o600)
                        else:
                            target.write_text('' if kind == 'empty' else 'x' * 16385 if kind == 'oversize' else TOKEN)
                            target.chmod(0o644 if kind == 'weak' else 0o600)
                            if kind == 'hardlink':
                                os.link(target, profile / 'alias')
                        supplier = mock.Mock()
                        with self.assertRaises(setup.ConfigurationError):
                            setup.configure(profile, URL, token_supplier=supplier)
                        supplier.assert_not_called()

    def test_wrong_owner_rejected(self):
        self.seed()
        with mock.patch.object(setup.os, 'getuid', return_value=os.getuid() + 1):
            with self.assertRaises(setup.ConfigurationError):
                self.run_setup()
        info = (self.profile / 'api.token').stat()
        attributes = {key: getattr(info, key) for key in
                      ('st_mode', 'st_nlink', 'st_size', 'st_uid')}
        attributes['st_uid'] += 1
        with mock.patch.object(Path, 'lstat', return_value=type('Info', (), attributes)()):
            with self.assertRaises(setup.ConfigurationError):
                setup.check_file(self.profile / 'api.token', 8192)

    def test_strict_existing_config(self):
        self.seed()
        for content in ('{}', '{"apiUrl":"https://vpn.example.com/api","allowWrites":0}',
                        '{"apiUrl":"https://vpn.example.com/api","allowWrites":false,"extra":1}',
                        '{"apiUrl":"https://vpn.example.com/api","allowWrites":false,"allowWrites":true}',
                        'not-json', '\udcff'):
            (self.profile / 'config.json').write_bytes(content.encode('utf-8', errors='surrogateescape'))
            with self.assertRaises(setup.ConfigurationError):
                self.run_setup(update_config=True)

    def test_atomic_failure_preserves_old_token(self):
        self.seed()
        with mock.patch.object(setup.os, 'replace', side_effect=OSError('synthetic')):
            with self.assertRaises(OSError):
                self.run_setup(replace_token=True, token_supplier=lambda: 'rotated-synthetic')
        self.assertEqual((self.profile / 'api.token').read_text(), TOKEN)
        self.assertEqual(sorted(p.name for p in self.profile.iterdir()), ['api.token', 'config.json'])

    def test_no_clobber_publication(self):
        self.seed()
        with self.assertRaises(FileExistsError):
            setup.atomic_write(self.profile / 'api.token', b'new-synthetic', False)
        self.assertEqual((self.profile / 'api.token').read_text(), TOKEN)

    def cli(self, argv, tty=False):
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(Path, 'home', return_value=self.root), \
                mock.patch.object(setup.sys.stdin, 'isatty', return_value=tty), \
                contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            result = setup.main(argv)
        return result, out.getvalue() + err.getvalue()

    def test_cli_fixed_path_reuse_and_generic_success(self):
        setup.configure(self.root / '.netbird-pi', URL, token_supplier=lambda: TOKEN)
        code, output = self.cli(['--api-url', URL])
        self.assertEqual(code, 0)
        self.assertIn('~/.netbird-pi', output)
        self.assertNotIn(str(self.root), output)
        self.assertNotIn(TOKEN, output)

    def test_cli_non_tty_refuses_new_token_and_missing_url(self):
        for args in ([], ['--api-url', URL]):
            code, output = self.cli(args)
            self.assertEqual(code, 1)
            self.assertNotIn(TOKEN, output)
            self.assertFalse((self.root / '.netbird-pi').exists())

    def test_cli_unknown_arguments_never_echoed(self):
        with self.assertRaises(SystemExit) as error:
            with contextlib.redirect_stderr(io.StringIO()) as err:
                setup.main(['--token', TOKEN])
        self.assertEqual(error.exception.code, 2)
        self.assertNotIn(TOKEN, err.getvalue())

    def test_cli_help(self):
        with self.assertRaises(SystemExit) as error:
            with contextlib.redirect_stdout(io.StringIO()) as out:
                setup.main(['--help'])
        self.assertEqual(error.exception.code, 0)
        self.assertIn('--replace-token', out.getvalue())

    def test_getpass_fallback_never_echoes(self):
        with mock.patch.object(setup.sys.stdin, 'isatty', return_value=True), \
                mock.patch.object(setup.os, 'open', side_effect=OSError), \
                mock.patch.object(setup.getpass, 'getpass') as prompt:
            with self.assertRaises(setup.ConfigurationError):
                setup.terminal_token()
        prompt.assert_not_called()

    def test_source_has_no_network_imports(self):
        import ast
        tree = ast.parse(Path(setup.__file__).read_text())
        imported = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.extend(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                imported.append(node.module)
        self.assertFalse(set(imported) & {'socket', 'requests', 'http.client', 'urllib.request'})


if __name__ == '__main__':
    unittest.main()
