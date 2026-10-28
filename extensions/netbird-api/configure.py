#!/usr/bin/env python3
"""Offline credential setup (Python 3.9+).

The owner-only profile directory is a trust boundary: concurrent processes running
as the same UID can race metadata checks/renames. No cross-file transaction or
protection against a hostile same-UID process is claimed. Rotation replaces only
the local credential; it does not revoke an API token. Never put tokens in shell
history: this CLI accepts them only through getpass on a real terminal.
"""
import argparse
import getpass
import json
import ipaddress
import re
import os
from pathlib import Path
import stat
import sys
import tempfile
from urllib.parse import urlsplit


class ConfigurationError(Exception):
    pass


def normalize_url(value):
    try:
        if not isinstance(value, str) or any(c.isspace() for c in value):
            raise ValueError()
        parsed = urlsplit(value)
        authority = parsed.netloc
        authority.encode('ascii')
        if (parsed.scheme != 'https' or not parsed.hostname or not authority
                or '@' in authority or '?' in value or '#' in value
                or parsed.path not in ('', '/', '/api', '/api/')
                or '\\' in value or '%' in authority
                or any(ord(c) < 33 or ord(c) > 126 for c in authority)):
            raise ValueError()
        host = parsed.hostname
        if ':' in host:
            ipaddress.IPv6Address(host)
            if not re.fullmatch(r'\[[0-9A-Fa-f:.]+\](?::[0-9]+)?', authority):
                raise ValueError()
        elif not all(re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?', label)
                     for label in host.rstrip('.').split('.')):
            raise ValueError()
        port = parsed.port
        if authority.endswith(':') or port == 0:
            raise ValueError()
        return 'https://' + authority + '/api'
    except (ValueError, UnicodeError):
        raise ConfigurationError('Invalid API URL.') from None


def validate_token(token):
    if (not isinstance(token, str) or not 8 <= len(token) <= 8192
            or any(not 33 <= ord(c) <= 126 for c in token)):
        raise ConfigurationError('Invalid token format.')
    return token.encode('ascii')


def check_directory(path):
    info = path.lstat()
    if (not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid()
            or stat.S_IMODE(info.st_mode) != 0o700):
        raise ConfigurationError('Profile must be an owner-only private directory.')


def check_file(path, maximum):
    try:
        info = path.lstat()
    except FileNotFoundError:
        return None
    if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1
            or info.st_uid != os.getuid()
            or stat.S_IMODE(info.st_mode) not in (0o600, 0o400)
            or not 0 < info.st_size <= maximum):
        raise ConfigurationError('Unsafe profile file metadata.')
    return info


def read_config(path, expected):
    fd = os.open(str(path), os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0)
                 | getattr(os, 'O_NONBLOCK', 0))
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if (info.st_dev, info.st_ino, info.st_mode, info.st_uid,
                info.st_nlink, info.st_size) != (
                expected.st_dev, expected.st_ino, expected.st_mode,
                expected.st_uid, expected.st_nlink, expected.st_size):
            raise ConfigurationError('Profile changed during setup.')
        raw = stream.read(4097)
    try:
        def unique_pairs(pairs):
            result = {}
            for key, value in pairs:
                if key in result:
                    raise ValueError()
                result[key] = value
            return result
        data = json.loads(raw.decode('utf-8'), object_pairs_hook=unique_pairs)
        if (len(raw) > 4096 or not isinstance(data, dict)
                or set(data) != {'apiUrl', 'allowWrites'}
                or type(data['allowWrites']) is not bool
                or normalize_url(data['apiUrl']) != data['apiUrl']):
            raise ValueError()
        return data
    except (ValueError, UnicodeError, ConfigurationError):
        raise ConfigurationError('Invalid existing configuration.') from None


def atomic_write(path, data, replace):
    temporary = None
    try:
        fd, temporary = tempfile.mkstemp(prefix='.setup-', dir=str(path.parent))
        with os.fdopen(fd, 'wb') as stream:
            os.fchmod(stream.fileno(), 0o600)
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        if replace:
            os.replace(temporary, path)
        else:
            # Hard-link publication refuses to clobber a concurrently created file.
            os.link(temporary, path)
        if not replace:
            os.unlink(temporary)
        temporary = None
        directory_fd = os.open(str(path.parent), os.O_RDONLY | getattr(os, 'O_DIRECTORY', 0))
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if temporary is not None:
            os.unlink(temporary)


def configure(profile_dir, api_url, allow_writes=False, update_config=False,
              replace_token=False, token_supplier=None):
    """Configure an explicitly supplied private path; existing tokens are not read.

    Inputs and existing metadata are checked before prompting or writing. A late
    I/O failure may leave a new config installed; token replacement itself is an
    atomic rename, never a delete-then-write operation.
    """
    desired = {'apiUrl': normalize_url(api_url), 'allowWrites': allow_writes}
    if type(allow_writes) is not bool:
        raise ConfigurationError('Invalid write permission setting.')
    path = Path(profile_dir)
    try:
        path.lstat()
    except FileNotFoundError:
        exists = False
    else:
        exists = True
        check_directory(path)
    config_path, token_path = path / 'config.json', path / 'api.token'
    config_info = check_file(config_path, 4096) if exists else None
    token_info = check_file(token_path, 16384) if exists else None
    current = read_config(config_path, config_info) if config_info else None
    if current is not None and current != desired and not update_config:
        raise ConfigurationError('Changing configuration requires --update-config.')
    token_bytes = None
    if token_info is None or replace_token:
        if token_supplier is None:
            raise ConfigurationError('A private terminal token prompt is required.')
        token_bytes = validate_token(token_supplier())
    if not exists:
        path.mkdir(mode=0o700)
        check_directory(path)
    if current != desired:
        atomic_write(config_path, (json.dumps(desired) + '\n').encode('utf-8'), config_info is not None)
    if token_bytes is not None:
        atomic_write(token_path, token_bytes, token_info is not None)


class SafeParser(argparse.ArgumentParser):
    def error(self, message):
        self.exit(2, 'Invalid command-line arguments. Use --help.\n')


def terminal_token():
    if not sys.stdin.isatty():
        raise ConfigurationError('Token entry requires a real terminal.')
    # Refuse getpass fallback: opening /dev/tty must succeed before prompting.
    try:
        fd = os.open('/dev/tty', os.O_RDWR | getattr(os, 'O_NOCTTY', 0))
        try:
            if not os.isatty(fd):
                raise ConfigurationError('Token entry requires a real terminal.')
        finally:
            os.close(fd)
    except OSError:
        raise ConfigurationError('Token entry requires a real terminal.') from None
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter('error', getpass.GetPassWarning)
        return getpass.getpass('API token (hidden): ')


def main(argv=None):
    parser = SafeParser(description='Offline setup for ~/.netbird-pi; never pass tokens as arguments.')
    parser.add_argument('--api-url')
    parser.add_argument('--allow-writes', action='store_true', help='Enable later UI-gated mutations.')
    parser.add_argument('--update-config', action='store_true')
    parser.add_argument('--replace-token', action='store_true', help='Rotate local token only; no API revocation.')
    args = parser.parse_args(argv)
    try:
        url = args.api_url
        if url is None:
            if not sys.stdin.isatty():
                raise ConfigurationError('Supply --api-url or use a terminal.')
            url = input('API URL: ')
        configure(Path.home() / '.netbird-pi', url, args.allow_writes,
                  args.update_config, args.replace_token, terminal_token)
    except (ConfigurationError, OSError, ValueError, EOFError, KeyboardInterrupt, getpass.GetPassWarning):
        print('Setup failed; check inputs and private profile permissions.', file=sys.stderr)
        return 1
    print('Configured ~/.netbird-pi.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
