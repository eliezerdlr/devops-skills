# Ghidra runtime installation and configuration

Optional, operator-run setup only. Package loading never performs this procedure. Use a dedicated non-root user directory; do not alter global JAVA_HOME/PATH or install a background service. Review current security advisories and the exact release requirements first. Do not use a Git source checkout as the executable distribution.

## Validated local profile

- macOS arm64, Ghidra 12.2, Eclipse Temurin 25.0.5+8 arm64.
- Release URLs and official asset SHA256 digests: [runtime-lock.json](../../integrations/ghidra/runtime-lock.json). The documentation-source commit is a separate provenance record.
- Java 25 is private to this integration; an existing system Java 17 is not replaced.
- Linux/Windows loader branches exist but have not undergone real runtime validation. Select a reviewed platform-specific JDK and native components before claiming readiness. Python/JPype/MCP/Gradle are not needed for the validated headless path.

## Fresh installation

1. Read the lock. Download the two exact assets from their pinned HTTPS URLs to a private staging directory. A standard Python 3 example, run from the repository root:

```python
import hashlib, json, pathlib, urllib.request
lock = json.loads(pathlib.Path('integrations/ghidra/runtime-lock.json').read_text())
stage = pathlib.Path.home() / '.local/share/devops-skills/ghidra-downloads'
stage.mkdir(parents=True, exist_ok=True, mode=0o700)
for key in ('ghidra', 'javaMacArm64'):
    item = lock[key]
    target = stage / item['url'].split('/')[-1]
    if not target.exists():
        # Exclusive creation; interrupted downloads remain for inspection, not execution.
        with urllib.request.urlopen(item['url'], timeout=60) as src, target.open('xb') as dst:
            while block := src.read(1024 * 1024):
                dst.write(block)
        target.chmod(0o600)
    actual = hashlib.file_digest(target.open('rb'), 'sha256').hexdigest()
    if actual != item['sha256']:
        raise RuntimeError(f'Checksum mismatch: {target}; do not extract or execute')
    print(target, actual)
```

This example needs Python 3.11+ for `file_digest`; it downloads only, never launches or extracts. On download failure inspect/delete only the failed staging file before a deliberate retry. Do not substitute `latest` URLs or skip verification.

2. Extract into a **new**, private destination, for example `~/.local/share/devops-skills/ghidra-12.2`. Check archive members for absolute/traversal paths before extraction; ZIP symlinks must be rejected, regular executable modes restored, and tar extraction must use Python's `filter='data'` or an equivalently safe reviewed extractor. Never merge over an existing installation. The Ghidra ZIP contains `ghidra_12.2_PUBLIC`; put the JDK under a separate `java/` subdirectory. On macOS its javaHome ends with `jdk-25.0.5+8/Contents/Home`.

3. macOS releases need native components. With existing Apple command-line compiler tools, build the decompiler from the **verified release's** bundled source (no dependency downloads):

```sh
set -eu
# Set GHIDRA_HOME to the new ghidra_12.2_PUBLIC directory first.
cd "$GHIDRA_HOME/Ghidra/Features/Decompiler/src/decompile/cpp"
make -j4 ghidra_opt 'ARCH_TYPE=-arch arm64' 'ADDITIONAL_FLAGS=-mmacosx-version-min=11.0'
mkdir -p "$GHIDRA_HOME/Ghidra/Features/Decompiler/os/mac_arm_64"
# Fresh destination only; refuse an existing native file rather than overwrite.
test ! -e "$GHIDRA_HOME/Ghidra/Features/Decompiler/os/mac_arm_64/decompile"
cp -n ghidra_opt "$GHIDRA_HOME/Ghidra/Features/Decompiler/os/mac_arm_64/decompile"
chmod 700 "$GHIDRA_HOME/Ghidra/Features/Decompiler/os/mac_arm_64/decompile"
```

Abort on any failed command; retain build logs and record local SHA256/compiler version. The observed native digest in the lock is a receipt of the tested host, not an upstream checksum or portable reproducible-build promise. This adapter needs the decompiler only; GUI/other native features are not validated by that build.

4. Create `~/.config/devops-skills/ghidra.json` privately, without overwriting an existing configuration. Keys must be exactly:

```json
{
  "ghidraHome": "/absolute/path/ghidra_12.2_PUBLIC",
  "javaHome": "/absolute/path/java/jdk-25.0.5+8/Contents/Home"
}
```

Use `umask 077`, an exclusive create (`open(..., 'x')` / `flag: 'wx'`), directory mode 700 and file mode 600 on POSIX. Do not store tokens. `DEVOPS_GHIDRA_CONFIG` may point to another absolute configuration file; changing it requires restarting/reloading the session as appropriate. Configured runtime directories must be owned and trusted, not writable by other users. Version/path checks are not full distribution integrity verification.

5. From the repository root, run `node integrations/ghidra/adapter.mjs status`, then explicitly `npm run test:ghidra:live`. Confirm `status: completed`, real non-empty decompiled C, zero decompile failures and `sampleExecuted: false`. Load the root Pi package, `/reload`, then `/ghidra-status`. Real GUI confirmation still applies for every analysis.

## Recovery, upgrades and removal

Install upgrades side by side, update the reviewed lock/adapter support intentionally, validate a benign fixture, back up configuration and switch it atomically. Never silently accept an unsupported version. To roll back, restore the previous private config and `/reload`; do not delete outputs or the previous runtime automatically. Existing global Java and unrelated Ghidra installations are untouched.

Unregister the root Ghidra extension to disable tools; retain skill documentation if desired. Manually remove only dedicated runtime/config/report paths after verifying ownership and retention requirements. No daemon, login item or service was installed.
