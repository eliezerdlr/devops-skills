# Dependencies and host integration

## What loading this pack requires

Pi installed and an authenticated model/provider. Reading Markdown skills does not require installing Python libraries, npm integration dependencies or infrastructure CLIs. No target script is run automatically by this package.

The root `package.json` declares skills, three adapted ECC network role prompts and the locally authored ops-orchestrator extension. It has no bundled runtime dependencies, install scripts or automatic hooks. Pi coding-agent, pi-agent-core and TypeBox are host peer dependencies; orchestration is tested on Pi 1.2.0 / Node 22.23.1. It is private to avoid accidental npm publication; this does not make a GitHub repository private.

See [ORCHESTRATION.md](ORCHESTRATION.md) for the executable integration, approval boundary, model/data requirements and how to disable it while retaining skills/prompts. No child-worker tools or third-party setup are activated.

This is not a full workstation bootstrap. Credentials, network access, cloud subscriptions, target software and permissions must be provided separately. Do not install every dependency globally or run `npm install` recursively over all manifests.

## Pi setup

Choose **one** method to avoid duplicate skill names.

### Clone and register a local package

Clone to a chosen directory, then merge a `packages` entry into the existing `~/.pi/agent/settings.json`:

```json
{
  "packages": ["~/devops-skills"]
}
```

Replace the path if the checkout is elsewhere. Preserve existing settings and package entries; do not overwrite the whole file. `examples/pi-settings.json` is a merge example, not an installer. The package manifest's `**/SKILL.md` glob selects every specialist even though their parent contains the catalogue. Pi stops directory traversal at a skill root; registering only the catalogue directory would load only that index. Use the package method tested here instead of assuming top-level settings globs behave like package manifest globs. Run `/reload` after editing settings or pulling updates.

### Register the checkout as a local Pi package

```bash
pi install /absolute/path/to/devops-skills
```

This uses the root Pi manifest and records the package in Pi settings. A Git source may be used after this repository is published, using the actual owner/repository URL. No GitHub owner has been assumed here. Model/provider authentication remains separate.

Pi can also discover skills in its conventional `.pi/skills` and `.agents/skills` locations; this repository is not automatically one of those locations simply because it has a `skills/` directory.

Do not copy another project's SYSTEM.md, AGENTS.md or lifecycle hooks into the global Pi configuration. A SYSTEM.md can replace the default system prompt. Listing agent definition Markdown files is not native subagent execution.

## Optional Python dependencies

A static AST inventory parsed 171 bundled Python files without syntax errors on Python 3.14.8. This is not a claim of runtime compatibility with every Python version. Python 3.10+ is a provisional baseline for modern type syntax; supported runtime versions must be verified for the chosen scripts. One inherited invalid-escape warning occurs in `ms365-tenant-manager/scripts/powershell_generator.py`; script source has not been modified.

| Python import / distribution | Where used | Requirement scope |
|---|---|---|
| `yaml` / PyYAML | mcp-server-builder, senior-backend, senior-data-engineer, senior-computer-vision, skill-tester | YAML workflows; some scripts have fallbacks. Do not assume every import is mandatory at startup. |
| `PIL` / Pillow | epic-design asset inspection; generated image stitching in full-page-screenshot | Image-specific operations only |
| NumPy, ONNX, ONNX Runtime, PyTorch | senior-computer-vision inference_optimizer.py | Selected inference, optimization and benchmark branches; CPU/GPU builds differ |
| requests | tech-debt-tracker sample payment code | Sample application, not a requirement of the debt scanner itself |
| Playwright Python and its browser binaries | browser-automation generated examples | Required for generated browser workflows, not for merely generating the script |

`security_scorer` is a bundled skill-tester module, not a package to fetch from PyPI. Tests add their sibling scripts directory to the Python path.

There is no reviewed, reproducible global Python lockfile in this pack. Do not add guessed version pins or install all optional packages by default. Use isolated task-specific virtual environments and pin/test versions when enabling a workflow. Generated application source may introduce additional dependencies beyond imports in the generator itself.

## Node, browser and MCP dependencies

- `full-page-screenshot`: Node.js 22+ (built-in WebSocket), Chrome/Chromium with local remote debugging. Multi-tile stitching uses Python/Pillow. A CDP-proxy multi-tile branch also invokes macOS `sips` before its Python fallback; do not claim full Linux support for that path until tested. Do not expose the debugging endpoint externally.
- `epic-design/scripts/validate-layers.js`: Node built-ins only.
- Playwright workflows: the target project's Playwright package, browser installation and application/test configuration. Cloud test providers require their own credentials and service access.
- Optional `playwright-pro/integrations/{browserstack-mcp,testrail-mcp}`: `@modelcontextprotocol/sdk` runtime dependency; `tsx` and TypeScript are declared as devDependencies. The documented `npm start` runs `tsx`, so an `--omit=dev` install alone will not run it as supplied. Neither integration has a bundled dependency lockfile. Review/pin compatible versions and build or retain the runtime launcher before enabling.
- Those MCP integrations are separate programs, not loaded or started by the root Pi manifest. Review their example MCP configuration and actual build output before registering them with the host. Do not blindly copy an old Claude-specific configuration into Pi.
- `dependency-auditor/test-project/package.json` is an audit fixture with deliberately old sample dependencies and an incomplete sample app, not an application to install. Its packages are NOT dependencies of this pack.

No live advisory query was performed during this review. A temporary TypeScript 5.9.3 compiler was installed with lifecycle scripts disabled for orchestration type-checking, outside this repository. This does not install the skills' optional integrations or establish a clean CVE result.

## deep-agents-core (LangChain)

This Markdown skill teaches development with LangChain's Deep Agents framework; it is not a Pi extension, a subagent runner or an executable scanner. Loading it requires no extra packages.

To execute examples, create an isolated project and install a reviewed compatible framework stack:
- Python examples import `deepagents`, LangChain tools and LangGraph checkpoint/store APIs.
- TypeScript examples import `deepagents`, `@langchain/core`, `@langchain/langgraph` and `zod`.
- The chosen model requires its provider integration, credentials, access and billing as applicable.

These are optional dependencies of the application being developed, NOT root dependencies of this skills pack. The skill does not specify a tested version matrix; do not invent pins or claim the examples were runtime-tested here.

Example limitations to review before implementation:
- `custom_tool1`, `custom_tool2`, subagent variables and their TypeScript equivalents are placeholders, not a complete runnable application.
- MemorySaver/InMemoryStore retain state in memory only; they do not provide durable storage across process restarts.
- Reusing thread_id does not alone guarantee conversation persistence without a configured checkpointer; isolate thread identities per authorised user/session.
- Filesystem root/virtual mode is not a complete security sandbox. Define real file, network and tool permissions independently.
- Approval configured for write_file alone does not govern every custom tool or other side effect.
- Model identifiers, middleware availability and backend path semantics must be checked against the selected framework version.

The upstream SKILL.md is preserved unchanged. These local notes qualify example usage; inclusion is not an independent security assessment or endorsement.

## dsh-error-handling (DeepSeek)

This included Markdown skill has no executable files, package dependencies or required model provider. It teaches error contracts, recovery responsibility, bounded retries, containment and observable outcomes. It can be read in Pi without DeepSeek Harness. The runtime, plugins, shell commands, project hooks and sandbox from that repository are not included or activated. Following the guidance is not an independent security assessment and does not implement recovery controls automatically.

## External tools and services by workflow

| Workflow | Tools / access needed when actually performing it |
|---|---|
| Git review, worktrees, changelogs | Git; some repository/PR operations require authenticated GitHub tooling |
| Terraform scaffolding validation | Terraform; init may download providers/modules and require network access |
| Cloud operations | Relevant cloud CLI/SDK, authorised identity, correct account/project/subscription |
| Kubernetes and containers | kubectl, Docker/Compose or the actual chosen runtime; access to the intended cluster/daemon |
| Google Workspace | gws CLI, OAuth configuration/scopes and tenant permissions; some bundled scripts fall back to demo output if gws is absent, which is not a live audit |
| Microsoft 365 | PowerShell and applicable Graph/Exchange modules and authorised tenant access for generated commands; generating text alone does not install or authenticate them |
| Network automation from ECC skills | Netmiko and optionally ntc-templates/TextFSM, device SSH access and verified host keys; diagnostic OS/vendor commands vary |
| Security tests, load tests and incident response | Tools explicitly selected by the workflow, written scope/authorisation and appropriate isolated environment |

This table describes workflow families, not an exhaustive executable allowlist. Instructions and generated code may mention further tools. Commands that are absent should produce a prerequisite check, not an automatic unapproved install.

## Source repositories and separate tools

### Engineering source repository

The selected skills are bundled, not its entire development environment. Its root `requirements-dev.txt` declares `pytest>=8.0,<9.0`; root `pyproject.toml` configures pytest rather than packaging a runtime application. These development requirements do not cover all optional imports in the selected skills. Copying that requirements file alone would not make every script runnable.

### ECC

Eight selected skills are now included unchanged, plus three network agents adapted as same-session Pi prompts. Those Markdown resources do not require installing the ECC framework merely to read them. The manifest explicitly lists the three prompt files; no agent README or licence is loaded as a command. Adapted frontmatter does not select a Claude model or impose tool permissions. The locally authored orchestration extension can run these roles as separate tool-free Pi core workers; it is not the upstream ECC adapter. Netmiko collection examples need their separate Python dependencies; kubectl/Linux/network commands are task-specific.

The complete ECC repository declares a Node runtime, npm dependencies, a Python LLM abstraction package (Python >=3.11 with anthropic/openai), a prepack build, Pi extension code, hooks, rules and commands. Do not inherit that root manifest for a small curated subset.

ECC has an actual Pi adapter under `.pi/extensions/`. It depends on ECC hook scripts/rules and does not implement subagent conversion itself. Its README was verified against an older Pi release; some MCP statements differ from current Pi documentation. Copying the adapter alone would not provide a complete tested integration. No upstream ECC adapter is included in this pack; see the separate locally authored [orchestration implementation](ORCHESTRATION.md).

### Snyk Agent Scan

Not bundled or installed here. The inspected official source declares version 0.6.8, Python >=3.10, a Hatchling build and runtime packages including rich, pydantic, aiohttp, PyYAML, MCP, regex and detect-secrets. Its uv configuration includes security-related transitive overrides. Installing from source without the intended resolver/lock can change resolution; do not flatten those dependencies into this skills package.

Use a separately verified official binary or pinned isolated Python installation. Analysis requires service authentication and authorised content transmission; source licensing does not grant unlimited API access. No official scan has been performed.

### Gen Digital Sage

Not bundled or installed here. The inspected repository uses a pnpm 10.29.3 workspace, Node >=18, multiple connector/core packages, native/model dependencies and a root `prepare` script installing Git hooks. A plain dependency install may therefore have effects beyond downloading libraries. Do not copy its workspace manifest or run its installer just to provide skills.

The documented connectors target Claude Code, Cursor/VS Code, OpenClaw and OpenCode, not a verified Pi connector. It is runtime protection, not an automatic pre-install approval gate. Cloud skill uploads default to enabled per its documentation. Separate licensing applies to detection rules.

## Validation status and publication limits

Completed without running bundled scripts:
- Python AST parsing: 171 files; no syntax errors on the review interpreter, one inherited escape warning.
- JavaScript syntax checks: standalone JS/MJS files passed Node 22.23.1 `--check`; TypeScript modules were not compiled.
- Bash syntax checks: three bundled hook scripts passed `bash -n`; they are not Pi hooks and were not activated.
- The original 90 SKILL.md frontmatters (89 specialists plus index) passed safe YAML/name/description checks. After adding deep-agents-core, eight ECC skills and dsh-error-handling, all 100 entrypoints (99 specialists plus index) were rechecked for metadata and catalogue coverage, along with three role prompt files; examples were not executed.
- Three npm manifests classified: two optional MCP integrations and one fixture, not root pack dependencies.

Not completed: dependency installation/resolution, build/integration tests, live CVE/licence databases, exhaustive generated-code dependency resolution, clean-machine Pi loading and subagent execution. Do not publish claims that the whole pack works without setup or has passed security analysis.
