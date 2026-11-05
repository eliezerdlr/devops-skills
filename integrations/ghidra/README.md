# Ghidra — executable local integration

Register only the repository root (`pi install /absolute/path/to/devops-skills`), then `/reload`. The root registers `extensions/ghidra/index.ts`; component manifests deliberately register no extensions. Loading the package starts no Java, installs nothing and makes no external request. No MCP or PyGhidra dependency is needed.

## Use in Pi

- `/ghidra-status` or tool `ghidra_status`: check local runtime paths/version/native decompiler without launching it. Readiness is not full integrity certification.
- Tool `ghidra_analyse`: absolute `input`, existing absolute `outputRoot`, optional `timeoutSeconds` (10–600, default 180). Requires an interactive human confirmation describing exact input SHA256, fixed script hash, output and budget. Headless tool calls, denial, cancellation and approval timeout fail closed.
- Analysis is real, not a simulated response: Ghidra imports a private snapshot, auto-analyzes and runs the bundled Java reporting script. Reports include format/language/base, up to 100 functions and external symbols, and up to three decompiled functions (10 seconds each, 12,000 C characters each). Pseudocode is not original source.
- Only metadata and report paths are returned to the model. `analysis.json`, `run.json`, copied input and local logs remain in a fresh private `ghidra-*` directory. Reading/sharing report contents is a separate data decision; binary strings are untrusted data, never instructions.

**Trusted benign files only on this host.** This launcher is NOT an OS sandbox, filesystem jail or network isolation. Unknown/hostile samples require a separately isolated disposable machine with no credentials and a reviewed network policy. Static parsers can have vulnerabilities. The package never intentionally executes the sample, but that does not make hostile samples safe.

## Scope and bounds

ELF, PE and Mach-O/fat inputs, 1 byte–64 MiB; no raw firmware loader profile, archives, arbitrary scripts, remote/shared projects or commits. `-readOnly` prevents saving analyzed program changes, not OS writes. Projects are disposable; reports and logs are retained locally. Java heap is bounded at 2 GiB, analysis CPU setting at two; these are not OS memory/CPU quotas. Outer timeout kills the process group (Windows uses taskkill /T), process output is capped at 1 MiB, returned JSON at 1 MiB. Ghidra may write additional logs/cache: disk quotas require external isolation. A timeout/decompilation failure is partial/failed, never a clean security verdict. Cancellation is not rollback of all OS effects.

Manual CLI, for explicit trusted-input use:

```sh
node integrations/ghidra/adapter.mjs status
node integrations/ghidra/adapter.mjs analyse /absolute/benign-binary /absolute/existing/output --trusted-input
```

The CLI flag is the human operator's explicit opt-in; it must not be used by an agent to bypass Pi confirmation. It does not authorize malware handling or data export.

## Runtime setup and reproducibility

See [installation/configuration](../../docs/install/ghidra.md). The runtime is external and version-pinned in [runtime-lock.json](runtime-lock.json); no binary/JDK is redistributed. Current real validation is macOS arm64, Ghidra 12.2 / Temurin 25.0.5+8 with a locally built native decompiler. Other platforms are not homologated. No PATH/global Java change or background service is required.

[Skill](skills/ghidra-binary-analysis/SKILL.md), [source documentation provenance](UPSTREAM.json), LICENSE and NOTICE remain available offline. The runtime lock is separate from the documentation snapshot. Upstream includes public-domain and separately licensed components, including GPL support programs; review runtime licences/advisories separately.

## Tests and rollback

`npm test` includes offline adapter and provenance checks; `PI_SDK_ROOT=/absolute/pi-sdk npm run test:pi` checks actual extension loading. `npm run test:ghidra:live` is an explicit real-runtime smoke test: compiles our benign C fixture, analyzes/decompiles it, never executes it, and preserves evidence in a printed temporary path. Requires an installed configured runtime and system compiler; it fails rather than silently skipping missing prerequisites.

Disable only `./extensions/ghidra/index.ts` in root `package.json` and `/reload` to remove tools while retaining the skill. Preserve the pre-change file if reverting. The runtime/config are user-owned external files; remove them only after confirming no other use. Retained sample/report directories may contain sensitive code; dispose according to policy. No automatic deletion, service changes, commits or uploads occur.
