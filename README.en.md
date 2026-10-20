# DevOps Skills

[Português](README.md) | **English**

A collection of skills for engineering, DevOps, cybersecurity, and IT operations.

Includes **99 skills/sub-skills**, three network prompts and an extension with **real subagents and declarative analysis workflows**. The skills are organized in the [main catalogue](skills/engineering-skills/SKILL.md). Each skill contains instructions and, where applicable, scripts, references, and assets.

## 1. Prerequisites

- Pi **1.2.0** and Node.js **22.14+** for orchestration, with an authenticated model/provider.
- Git to obtain and update the repository.
- Task-specific tools only for the workflows you intend to run; see [dependencies and compatibility](docs/DEPENDENCIES.md).

Skills are instructions, not services. The package also loads an executable orchestration extension; review its [scope, approvals and limits](docs/ORCHESTRATION.md). It does not install Terraform, kubectl, Python, browsers or credentials.

## 2. Enable skills in Pi

After cloning this repository, choose **one** of the following methods. Do not register the same copy through multiple methods, to avoid duplicate skill names.

### Option A — Register the path in settings.json

Edit `~/.pi/agent/settings.json` and add the checkout to the existing `packages` list as a local package:

```json
{
  "packages": ["/absolute/path/devops-skills"]
}
```

Replace the path with your actual checkout location. **Do not replace the entire settings file** if it already contains configuration: preserve other fields and paths.

The [configuration example](examples/pi-settings.json) uses `~/devops-skills`; adjust it if you cloned elsewhere. The package manifest explicitly selects all SKILL.md files, the three network prompts and the orchestration extension. Do not register only the catalogue directory under `skills`: Pi stops descending once it finds a SKILL.md in a directory.

### Option B — Install the checkout as a Pi package

```bash
pi install /absolute/path/devops-skills
pi list
```

The `package.json` manifest registers skills, three network role prompts and the `ops-orchestrator` extension. It includes no hooks, themes or installation scripts. Pi supplies the extension's peer dependencies; no root `npm install` is needed.

You can also install directly from GitHub:

```bash
pi install git:github.com/eliezerdlr/devops-skills
```

Choose this method or one of the local methods above, without registering the same resources twice.

### Reload and verify

Inside Pi:

```text
/reload
/skill:engineering-skills
```

The second command loads the catalogue. To select a specialist directly:

```text
/skill:senior-devops Review this pipeline and suggest improvements without making changes.
```

Check loading warnings. If a skill is missing, check paths, permissions, duplicate registrations, and SKILL.md formatting. For package installations, also check `pi list` and enabled resources in `pi config`. Project configuration may require project trust.

Pi advertises skill names/descriptions and loads detailed instructions when needed. You do not need to load every skill's full instructions at once.

## 3. Enable operational capabilities

**Registering the pack above makes the 99 skills available.** Running their workflows may require additional setup:

| Capability | Separate setup |
|---|---|
| Python scripts | Compatible interpreter; optional libraries in an isolated environment, depending on the script |
| Terraform/cloud | Selected CLI, authentication, correct account/project, and permissions |
| Kubernetes/containers | kubectl or Docker/Compose, configuration, and access to the intended environment |
| Browser testing | Project Playwright package and browsers, or Chrome/Chromium for CDP, depending on the skill |
| Microsoft 365/Google Workspace | Tools, modules, OAuth, and tenant permissions |
| BrowserStack/TestRail MCP | Separate integration installation/configuration, credentials, and review before enabling |

There is no single command that safely installs and authenticates everything. Do not recursively install every `package.json`: the pack contains test fixtures that are not applications to install.

The [dependency guide](docs/DEPENDENCIES.md) distinguishes optional libraries, examples, external services, platform limitations, and checks already performed.

### Building with Deep Agents

The [deep-agents-core](skills/engineering-skills/deep-agents-core/SKILL.md) skill from the LangChain project guides development of Deep Agents applications. It does not install the framework or add subagents or memory to Pi. Read the [dependencies and example limitations](docs/DEPENDENCIES.md#deep-agents-core-langchain) before running code.

### Reliability and error handling

The [dsh-error-handling](skills/engineering-skills/dsh-error-handling/SKILL.md) skill from DeepSeek Harness adds guidance on structured failures, recovery, safe retries and verifiable outcomes. Only the Markdown instructions are included; the DeepSeek runtime is not installed and Pi tools are not changed.

### ECC network agents

Eight ECC skills and three agents adapted as Pi prompts are included: `/network-architect`, `/network-troubleshooter`, and `/network-config-reviewer`. Both `pi install` and a `packages` entry in `settings.json` register them through the manifest.

These are roles in the current session, **not autonomous subagents or permission isolation**. See the [agent index](agents/README.md) and [post-pull testing guide](docs/TESTING.md).

### Real subagents and analysis workflows

The `ops_agent` and `ops_workflow` tools run ECC roles in independent Pi core instances with their own context and **no shell, file, MCP or infrastructure tools**. Workflows link diagnosis → proposal → review; they do not execute changes.

Every run requires a real UI confirmation, identifies the model/provider and has concurrency, time and output limits. Without UI, execution is refused. Use `/ops-status` and `/ops-cancel <id>` to monitor/cancel. No model calls occur at startup.

See [activation, usage, disabling and limits](docs/ORCHESTRATION.md) and the [synthetic workflow](workflows/network-review.json). **49 local tests passed**, including the actual Pi loader/core with simulated model transport; this is not production certification or real-device validation.

### Persistent planning — Planning with Files

An **optional** integration preserves the upstream Pi package 3.24.0 and its MIT licence. It adds `task_plan.md`, `findings.md` and `progress.md` for continuity between sessions. It does not automatically resume workers or replace orchestration approvals.

See [activation, combined workflow and hook risks](integrations/planning-with-files/README.md). It is not loaded by default: register the optional package explicitly and start in `notify` mode. **11 additional tests passed** on Pi 1.2.0; no live model calls or global configuration changes were made.

### Security auditing — optional integration

The [Security Audit integration](integrations/security-audit/README.md), adapted from Cloudflare under MIT, adds an evidence-led review skill, progressive domain references and three optional prompts: hunter, verifier and coverage critic. The schema, dependency-free validators and upstream tests are preserved.

**Focused guidance is the default**; full audits require explicit intent, scope, profile and budget. Prompts run in the current session and do not create subagents. Target-code execution requires an OS-enforced sandbox, which this integration does not provide. It is outside the main manifest and does not change the 99 core skills.

### Project context — optional Graphify

An [adapted Graphify skill](integrations/graphify/README.md) provides bounded-query, explicit-memory and incremental-update references, plus mapping/resume workflows. **It is not loaded by default** and does not change the 99 core skills. No agents, subagents, Python runtime, guard, hooks or automatic session collection are bundled.

Prepare the external dependency manually; no automatic installation or implicit semantic extraction is enabled. Reuse existing planning/TC handoffs for task continuity. Adapted content retains Apache-2.0, provenance and notices. Structural tests do not establish end-to-end functionality or token savings.

### What is not enabled/included
- Markdown agent definitions do not automatically become Pi subagents.
- Original hooks for other agent environments are not enabled by this pack.
- Snyk Agent Scan and Sage are neither distributed nor installed by this pack.
- No credentials, automatic infrastructure access, or SYSTEM.md/AGENTS.md changes are provided.

### UniFi — optional integration under review

The original project is available in [integrations/unifi-skills](integrations/unifi-skills/README.md), including five skills and a Python helper. **It is not loaded by this pack's Pi manifest** and is not part of the 99 main skills.

**Do not use unchanged in production:** the original helper disables TLS verification, permits writes by default, and may expose sensitive data in responses/dry-run output. Corrections and real-device tests have not been completed. Publication is not operational approval. Do not run examples against a company network with administrative credentials.

## 4. Updates

In your checkout directory:

```bash
git pull --ff-only
```

Review changes before loading them and resolve local modifications deliberately; do not force-overwrite them. Then, inside Pi:

```text
/reload
```

For copies managed directly through a Git source in `pi install`, use the package update mechanism supported by your installed Pi version. Pinned refs do not automatically advance to a new version.

## 5. Security and validation status

The included skills **have not undergone an official security assessment**. Structural, syntax, or licence checks do not guarantee security or complete functionality. Resource discovery and orchestration with simulated model transport were tested on Pi 1.2.0; live providers, interactive clean-machine setup and infrastructure workflows with real dependencies still require authorised validation.

Before executing scripts or actions, review the content, confirm tools and scope, start with read-only diagnosis, and require approval, a rollback plan, and an appropriate maintenance window for production changes. Do not store secrets in skills or this repository.

## 6. Licence and attribution

Upstream content is redistributed mainly under MIT; the adapted Graphify integration retains Apache-2.0 and its own notices. Notices are preserved in [LICENSE](LICENSE), nested licence files, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This is a curated/adapted collection, not a claim of exclusive authorship or official affiliation with upstream authors, Snyk, or Gen Digital.

New independent local contributions are also distributed under MIT, as authorised by the maintainer; Graphify adaptations retain the licence stated in that integration. Original component copyright notices remain preserved.
