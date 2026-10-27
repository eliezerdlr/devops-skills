#!/usr/bin/env python3
"""Read-only, offline checks for this portable skill; never prints matched values."""
import argparse
import ast
import ipaddress
import io
import json
import re
import stat
import sys
import tokenize
from pathlib import Path

NAME = "netbird-remote-access"
REQUIRED = (
    "SKILL.md", "README.md", "references/architecture.md",
    "references/operations.md", "references/evidence-and-docs.md",
    "references/privacy.md", "references/scenarios.md",
    "templates/compose.yaml", "templates/compose.bootstrap.yaml",
    "templates/environment.example", "scripts/validate_skill.py",
    "tests/test_validate_skill.py",
)
PUBLIC_DOCS = frozenset(("docs.netbird.io", "doc.traefik.io", "docs.docker.com", "docs.aws.amazon.com"))
DOCUMENT_NETWORKS = tuple(ipaddress.ip_network(n) for n in (
    "192.0.2.0/24", "198.51.100.0/24", "203.0.113.0/24", "2001:db8::/32",
))
ALLOWED_SPECIAL_IPS = frozenset(("127.0.0.1", "::1", "0.0.0.0", "::"))
MAX_FILES = 100
MAX_BYTES = 262144
TEXT_SUFFIXES = frozenset((".md", ".py", ".yaml", ".yml", ".example", ".json", ".txt"))
DOMAIN_SUFFIXES = frozenset(("com", "net", "org", "io", "dev", "app", "cloud", "tech", "ai", "co", "uk", "pt", "au", "cn", "local", "internal", "lan", "corp", "private"))
IGNORED_SUFFIXES = frozenset(("py", "md", "yaml", "yml", "json", "txt", "html", "svg", "pdf", "zip", "toml", "j2"))
IPV4 = re.compile(r"(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])")
IPV6 = re.compile(r"(?<![\w:])(?:[0-9a-fA-F]{0,4}:){2,}[0-9a-fA-F:.]*(?![\w:])")
DOMAIN = re.compile(r"(?<![\w.-])(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,24}(?![\w.-])")
PRIVACY_PATTERNS = (
    ("personal-path", re.compile(r"(?:/Users/|/home/)[A-Za-z0-9_.-]+|[A-Za-z]:[\\/]Users[\\/][A-Za-z0-9_.-]+")),
    ("aws-account", re.compile(r"(?<!\d)\d{12}(?!\d)")),
    ("aws-resource", re.compile(r"\b(?:i|vpc|subnet|sg|eni|vol|eipalloc|eipassoc)-[0-9a-f]{8,17}\b")),
    ("cloud-arn", re.compile(r"\barn:(?:aws|aws-us-gov|aws-cn):[^\s<>\"']+")),
    ("cloud-key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("uuid-value", re.compile(r"\b[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}\b")),
    ("private-material", re.compile(r"-----BEGIN (?:[A-Z ]*PRIVATE KEY|CERTIFICATE)-----")),
    ("public-key-material", re.compile(r"\bssh-(?:rsa|ed25519)\s+[A-Za-z0-9+/]{30,}={0,3}")),
    ("jwt-value", re.compile(r"\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
)
ASSIGNMENT = re.compile(r"(?im)^\s*[\"']?(?:(?:NB|AUTH|API|SESSION|STORE)_)?(?:SETUP_KEY|TOKEN|PASSWORD|PASSWD|SECRET|API_KEY|PRIVATE_KEY|AUTH_SECRET|ENCRYPTION_KEY)[\"']?\s*[:=]\s*(.+)$")
BANNED_MODULES = frozenset(("subprocess", "socket", "requests", "httpx", "aiohttp", "ftplib", "paramiko", "netmiko", "urllib.request", "http.client"))
BANNED_CALLS = frozenset(("eval", "exec", "__import__", "os.system", "os.popen", "os.getenv", "Path.home"))
INJECTION = re.compile(r"(?i)\b(?:ignore\s+(?:all\s+)?(?:previous|system)\s+instructions|skip\s+safety\s+checks|disable\s+content\s+filtering|run\s+any\s+command)\b")


def documented_domain(value):
    domain = value.lower().rstrip(".")
    return (domain in PUBLIC_DOCS or domain in ("example.com", "example.net", "example.org")
            or any(domain.endswith("." + d) for d in ("example.com", "example.net", "example.org"))
            or domain.endswith((".example", ".test", ".invalid")))


def allowed_address(value):
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        return True
    return str(address) in ALLOWED_SPECIAL_IPS or any(
        address.version == network.version and address in network for network in DOCUMENT_NETWORKS
    )


def privacy_findings(text, python_source=False):
    """Return codes and line numbers only; do not include the matched text."""
    data_tokens = []
    if python_source:
        try:
            data_tokens = [t for t in tokenize.generate_tokens(io.StringIO(text).readline)
                           if t.type in (tokenize.STRING, tokenize.COMMENT)]
        except (tokenize.TokenError, IndentationError):
            pass
    findings = []
    for number, line in enumerate(text.splitlines(), 1):
        codes = set()
        for code, pattern in PRIVACY_PATTERNS:
            if pattern.search(line):
                codes.add(code)
        for pattern in (IPV4, IPV6):
            if any(not allowed_address(m.group(0)) for m in pattern.finditer(line)):
                codes.add("non-documentation-address")
        for m in DOMAIN.finditer(line):
            if python_source and not any(
                t.start <= (number, m.start()) and t.end >= (number, m.end()) for t in data_tokens
            ):
                continue
            domain = m.group(0)
            suffix = domain.rsplit(".", 1)[-1].lower()
            if suffix in IGNORED_SUFFIXES:
                continue
            if (suffix in DOMAIN_SUFFIXES or len(suffix) == 2) and not documented_domain(domain):
                codes.add("non-documentation-domain")
        assignment = ASSIGNMENT.search(line)
        if assignment:
            value = assignment.group(1).strip().strip("\"'")
            if value and not value.startswith(("${", "<")):
                codes.add("literal-credential-assignment")
        if any(ch in line for ch in ("\u200b", "\u200c", "\u200d", "\ufeff")):
            codes.add("invisible-character")
        if INJECTION.search(line):
            codes.add("instruction-override")
        for code in sorted(codes):
            findings.append({"code": code, "line": number})
    return findings


def dotted_name(node):
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return dotted_name(node.value) + "." + node.attr
    return ""


def python_findings(text):
    try:
        tree = ast.parse(text)
    except SyntaxError as error:
        return [{"code": "python-syntax", "line": error.lineno or 1}]
    findings = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names = [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            names = [module] + [module + "." + alias.name for alias in node.names]
        else:
            names = []
        if any(any(name == banned or name.startswith(banned + ".") for banned in BANNED_MODULES) for name in names):
            findings.append({"code": "network-or-process-import", "line": node.lineno})
        if isinstance(node, ast.Call):
            call = dotted_name(node.func)
            if call in BANNED_CALLS or call.startswith(("os.exec", "os.spawn")):
                findings.append({"code": "active-or-dynamic-execution", "line": node.lineno})
        if isinstance(node, ast.Attribute) and dotted_name(node) == "os.environ":
            findings.append({"code": "environment-access", "line": node.lineno})
    return findings


def collect_files(root):
    files, findings = [], []
    stack = [(root, 0)]
    while stack:
        directory, depth = stack.pop()
        try:
            entries = sorted(directory.iterdir(), key=lambda p: p.name)
        except OSError:
            findings.append({"file": "[unreadable-directory]", "code": "directory-access", "line": 0})
            continue
        for item in entries:
            relative = item.relative_to(root).as_posix()
            label = "[redacted-name]" if privacy_findings(relative) else relative
            try:
                info = item.lstat()
            except OSError:
                findings.append({"file": label, "code": "file-access", "line": 0})
                continue
            if stat.S_ISLNK(info.st_mode):
                findings.append({"file": label, "code": "symlink-refused", "line": 0})
            elif item.name.startswith(".") or item.name == "__pycache__":
                findings.append({"file": label, "code": "hidden-or-cache-path", "line": 0})
            elif stat.S_ISDIR(info.st_mode):
                if depth >= 5:
                    findings.append({"file": label, "code": "depth-limit", "line": 0})
                else:
                    stack.append((item, depth + 1))
            elif not stat.S_ISREG(info.st_mode):
                findings.append({"file": label, "code": "special-file-refused", "line": 0})
            elif info.st_nlink > 1:
                findings.append({"file": label, "code": "hardlink-refused", "line": 0})
            elif item.suffix not in TEXT_SUFFIXES or info.st_size > MAX_BYTES:
                findings.append({"file": label, "code": "unsupported-or-large-file", "line": 0})
            else:
                files.append((item, label))
            if len(files) + len(findings) > MAX_FILES:
                findings.append({"file": "[package]", "code": "file-limit", "line": 0})
                return files, findings
    return files, findings


def validate(root):
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        return {"status": "FAIL", "files_checked": 0, "findings": [{"file": "[root]", "code": "invalid-root", "line": 0}]}
    root = root.resolve()
    files, findings = collect_files(root)
    contents = {}
    for path, label in files:
        try:
            # lstat checks above avoid ordinary symlinks/hardlinks; do not use on
            # an adversarial tree being mutated concurrently.
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            findings.append({"file": label, "code": "text-read", "line": 0})
            continue
        if any((ord(ch) < 32 and ch not in "\n\r\t") or 127 <= ord(ch) <= 159 for ch in text):
            findings.append({"file": label, "code": "binary-like-text", "line": 0})
            continue
        relative = path.relative_to(root).as_posix()
        contents[relative] = text
        for result in privacy_findings(relative) + privacy_findings(text, python_source=path.suffix == ".py"):
            findings.append({"file": label, **result})
        if path.suffix == ".py":
            for result in python_findings(text):
                findings.append({"file": label, **result})
        if path.suffix == ".md":
            for target in re.findall(r"\[[^\]]*\]\(([^\s)]+)\)", text):
                if target.startswith(("https://", "#")):
                    continue
                resolved = (path.parent / target.split("#", 1)[0]).resolve()
                if not resolved.is_relative_to(root) or not resolved.is_file():
                    findings.append({"file": label, "code": "reference-missing-or-outside", "line": 0})
    for required in REQUIRED:
        if required not in contents:
            findings.append({"file": required, "code": "required-file-missing", "line": 0})
    skill = contents.get("SKILL.md", "")
    frontmatter = re.match(r"\A---\n(.*?)\n---\n", skill, re.S)
    if not frontmatter:
        findings.append({"file": "SKILL.md", "code": "frontmatter", "line": 1})
    else:
        metadata = frontmatter.group(1)
        name = re.search(r"^name:\s*[\"']?([a-z0-9-]+)[\"']?\s*$", metadata, re.M)
        if not name or name.group(1) != NAME or root.name != NAME:
            findings.append({"file": "SKILL.md", "code": "skill-name", "line": 1})
        if not re.search(r"^description:\s*\S", metadata, re.M) or "Use when:" not in metadata:
            findings.append({"file": "SKILL.md", "code": "description-trigger", "line": 1})
    if len(skill.splitlines()) > 100 or len(skill.encode()) > 8192:
        findings.append({"file": "SKILL.md", "code": "entrypoint-too-long", "line": 1})
    return {"status": "FAIL" if findings else "PASS", "files_checked": len(contents), "findings": findings,
            "limitations": "Heuristics, not a DLP guarantee; no infrastructure or network validation; trusted stable package tree only."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Explicit package root; does not scan parent projects")
    args = parser.parse_args()
    result = validate(args.root)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
