"""Synthetic, offline tests; fixtures never use an infrastructure inventory."""
import contextlib
import importlib.util
import io
import ipaddress
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("validator", ROOT / "scripts" / "validate_skill.py")
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)


class PrivacyTests(unittest.TestCase):
    def codes(self, text):
        return {item["code"] for item in validator.privacy_findings(text)}

    def test_documentation_domains(self):
        for value in ("vpn.example.com", "router.example", "vpn.example.net", "node.test", "docs.netbird.io"):
            with self.subTest(value=value):
                self.assertEqual(self.codes(value), set())

    def test_documentation_networks(self):
        for value in ("192.0.2.10/24", "198.51.100.20", "203.0.113.7", "2001:db8::7/64", "127.0.0.1"):
            self.assertEqual(self.codes(value), set())

    def test_non_documentation_ipv4(self):
        for numeric in (0x0A010203, 0x08080808):
            self.assertIn("non-documentation-address", self.codes(str(ipaddress.IPv4Address(numeric))))

    def test_non_documentation_ipv6(self):
        address = str(ipaddress.IPv6Address((0x2600 << 112) + 1))
        self.assertIn("non-documentation-address", self.codes(address))

    def test_non_documentation_domain(self):
        value = "vpn." + "customer" + ".internal"
        self.assertIn("non-documentation-domain", self.codes(value))

    def test_reserved_suffix_cannot_hide_a_real_suffix(self):
        value = "vpn.example.com." + "customer" + ".internal"
        self.assertIn("non-documentation-domain", self.codes(value))

    def test_official_docs_do_not_allow_arbitrary_subdomains(self):
        self.assertIn("non-documentation-domain", self.codes("private." + "docs.netbird.io"))

    def test_cloud_account_and_resource(self):
        self.assertIn("aws-account", self.codes(str(10 ** 11 + 7)))
        self.assertIn("aws-resource", self.codes("i-" + "a" * 17))

    def test_cloud_key(self):
        value = "AK" + "IA" + "Z" * 16
        self.assertIn("cloud-key", self.codes(value))

    def test_uuid(self):
        value = "-".join(("a" * 8, "b" * 4, "c" * 4, "d" * 4, "e" * 12))
        self.assertIn("uuid-value", self.codes(value))

    def test_private_material(self):
        value = "-----BEGIN " + "PRIVATE KEY-----"
        self.assertIn("private-material", self.codes(value))

    def test_public_key_material(self):
        value = "ssh-" + "ed25519 " + "Z" * 40
        self.assertIn("public-key-material", self.codes(value))

    def test_jwt(self):
        value = "eyJ" + "a" * 20 + "." + "b" * 20 + "." + "c" * 20
        self.assertIn("jwt-value", self.codes(value))

    def test_credential_assignment_and_placeholders(self):
        prefix = "NB_" + "SETUP_KEY="
        self.assertIn("literal-credential-assignment", self.codes(prefix + "synthetic-only"))
        for value in ("<SETUP_KEY>", "${SETUP_KEY}"):
            self.assertNotIn("literal-credential-assignment", self.codes(prefix + value))
        self.assertEqual(self.codes("NB_SETUP_KEY_FILE: /run/secrets/netbird_setup_key"), set())

    def test_personal_path(self):
        self.assertIn("personal-path", self.codes("/" + "Users/" + "person"))

    def test_invisible_and_instruction_override(self):
        self.assertIn("invisible-character", self.codes("a" + chr(0x200B) + "b"))
        phrase = "ignore " + "previous instructions"
        self.assertIn("instruction-override", self.codes(phrase))

    def test_results_never_echo_the_matched_value(self):
        value = "AK" + "IA" + "Z" * 16
        self.assertNotIn(value, json.dumps(validator.privacy_findings(value)))


class PythonSafetyTests(unittest.TestCase):
    def test_offline_parser_is_allowed(self):
        self.assertEqual(validator.python_findings("import json\njson.loads('{}')\n"), [])

    def test_network_and_process_imports_are_rejected(self):
        for module in ("socket", "subprocess", "urllib.request"):
            with self.subTest(module=module):
                self.assertTrue(validator.python_findings("import " + module))

    def test_execution_and_environment_access(self):
        for sample in ("e" + "val('1')", "os." + "system('x')", "os." + "environ"):
            self.assertTrue(validator.python_findings(sample))

    def test_syntax_failure(self):
        self.assertEqual(validator.python_findings("def :")[0]["code"], "python-syntax")


class PackageTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name) / validator.NAME
        shutil.copytree(ROOT, self.root)

    def tearDown(self):
        self.temporary.cleanup()

    def codes(self):
        return {item["code"] for item in validator.validate(self.root)["findings"]}

    def test_shipped_package_passes(self):
        self.assertEqual(validator.validate(self.root)["status"], "PASS")

    def test_missing_file_fails(self):
        (self.root / "SKILL.md").unlink()
        self.assertIn("required-file-missing", self.codes())

    def test_name_must_match(self):
        p = self.root / "SKILL.md"
        p.write_text(p.read_text().replace("netbird-remote-access", "wrong-name", 1))
        self.assertIn("skill-name", self.codes())

    def test_entrypoint_limit(self):
        p = self.root / "SKILL.md"
        p.write_text(p.read_text() + "\n" * 101)
        self.assertIn("entrypoint-too-long", self.codes())

    def test_hidden_file_fails(self):
        (self.root / ".env").write_text("not a credential")
        self.assertIn("hidden-or-cache-path", self.codes())

    def test_binary_fails(self):
        (self.root / "payload.bin").write_bytes(bytes((0, 1, 2)))
        self.assertIn("unsupported-or-large-file", self.codes())

    def test_utf8_null_byte_fails(self):
        (self.root / "binary.txt").write_bytes(bytes((65, 0, 66)))
        self.assertIn("binary-like-text", self.codes())

    def test_normal_unicode_and_whitespace_are_allowed(self):
        (self.root / "unicode.txt").write_text("Configuração\n\tOperação e ligação\n")
        self.assertEqual(validator.validate(self.root)["status"], "PASS")

    def test_non_utf8_fails(self):
        (self.root / "bad.txt").write_bytes(bytes((255, 254)))
        self.assertIn("text-read", self.codes())

    def test_symlink_is_not_read(self):
        external = Path(self.temporary.name) / "outside.txt"
        external.write_text("AK" + "IA" + "Z" * 16)
        (self.root / "link.txt").symlink_to(external)
        self.assertIn("symlink-refused", self.codes())
        self.assertNotIn("cloud-key", self.codes())

    def test_hardlink_is_not_read(self):
        external = Path(self.temporary.name) / "outside.txt"
        external.write_text("AK" + "IA" + "Z" * 16)
        os.link(external, self.root / "link.txt")
        self.assertIn("hardlink-refused", self.codes())
        self.assertNotIn("cloud-key", self.codes())

    @unittest.skipUnless(hasattr(os, "mkfifo"), "POSIX FIFO required")
    def test_special_file_is_not_read(self):
        os.mkfifo(self.root / "pipe.txt")
        self.assertIn("special-file-refused", self.codes())

    def test_large_file_fails(self):
        (self.root / "large.txt").write_text("x" * (validator.MAX_BYTES + 1))
        self.assertIn("unsupported-or-large-file", self.codes())

    def test_external_reference_is_not_followed(self):
        p = self.root / "README.md"
        p.write_text(p.read_text() + "\n[outside](../../outside.md)\n")
        self.assertIn("reference-missing-or-outside", self.codes())

    def test_sensitive_name_is_redacted(self):
        name = "AK" + "IA" + "Z" * 16
        (self.root / (name + ".txt")).write_text("synthetic")
        report = json.dumps(validator.validate(self.root))
        self.assertNotIn(name, report)
        self.assertIn("redacted-name", report)

    def test_root_symlink_is_refused(self):
        link = Path(self.temporary.name) / "alias"
        link.symlink_to(self.root, target_is_directory=True)
        self.assertEqual(validator.validate(link)["findings"][0]["code"], "invalid-root")

    def test_cli_json_success(self):
        stream = io.StringIO()
        with patch.object(sys, "argv", ["validator", "--root", str(self.root)]), contextlib.redirect_stdout(stream):
            status = validator.main()
        self.assertEqual(status, 0)
        self.assertEqual(json.loads(stream.getvalue())["status"], "PASS")


class TemplateTests(unittest.TestCase):
    def test_base_has_guarded_parameters_and_persistent_identity(self):
        text = (ROOT / "templates" / "compose.yaml").read_text()
        for name in ("NB_PROJECT_NAME", "NB_IMAGE", "NB_HOSTNAME", "NB_STATE_DIR", "NB_MANAGEMENT_URL"):
            self.assertIn("${" + name + ":?", text)
        self.assertIn("create_host_path: false", text)
        self.assertIn("network_mode: host", text)
        self.assertNotIn("NB_SETUP_KEY_FILE", text)
        self.assertNotIn("privileged:", text)
        self.assertNotIn("sysctls:", text)
        self.assertNotIn("ports:", text)

    def test_bootstrap_only_adds_file_credential(self):
        text = (ROOT / "templates" / "compose.bootstrap.yaml").read_text()
        self.assertIn("NB_SETUP_KEY_FILE", text)
        self.assertIn("${NB_SETUP_KEY_PATH:?", text)
        self.assertNotIn("NB_SETUP_KEY:", text)

    def test_example_is_not_an_operational_inventory(self):
        text = (ROOT / "templates" / "environment.example").read_text()
        self.assertIn("<VERSION>", text)
        self.assertIn("<SHA256>", text)
        self.assertEqual(validator.privacy_findings(text), [])


if __name__ == "__main__":
    unittest.main()
