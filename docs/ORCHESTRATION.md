# Pi operations orchestration

## Supported scope

The pack now includes an executable Pi extension, not just agent-role prompts. It supports separate **Pi core Agent** instances for network analysis and declarative multi-step workflows. The workers have independent in-memory conversations and **zero tools**. They do not inherit shell access, files, MCP, project context, extensions, prompts or other sessions.

This is an intentionally bounded operational capability: evidence analysis, diagnosis, design and review. It does **not** perform deployments, changes, scanning, remote administration, credential handling or infrastructure rollback. A workflow's completed status means the requested analyses returned valid results, not that an environment is safe or a change is approved.

No new process or OS sandbox is claimed. The extension itself runs with Pi's user permissions and reads only the shipped allowlisted role/skill instruction files. The parent Pi session retains its existing tools and permissions. The same-provider model API remains a network operation.

## Design choice

The `davis7dotsh/my-pi-setup` project was reviewed as a design reference. Its complete setup, JavaScript workflow executor, UI, beta dependencies, download helpers and alternate Claude/Codex backends are **not vendored or activated**. This integration is locally authored using the Pi SDK/agent-core interfaces and existing ECC role content.

Instead of granting arbitrary JavaScript and inherited host tools to child workers, this implementation accepts a validated DAG and textual evidence. No runtime source code from my-pi-setup is included. The project remains a reference, not an affiliation or endorsement.

## Requirements and activation

Tested against **Pi 1.2.0** and **Node.js 22.23.1**. Root engines requires Node >=22.14. ES-module mode is scoped to the extension's own directory, preserving the existing skills' JavaScript module semantics. Host Pi, pi-agent-core and TypeBox are peer dependencies supplied by Pi; do not vendor a second copy into the runtime pack.

For an existing local package checkout:

```bash
cd /your/path/devops-skills
git pull --ff-only
```

If not already registered:

```bash
pi install /absolute/path/to/devops-skills
```

Restart Pi or run `/reload`. The manifest now loads `extensions/ops-orchestrator/index.ts` in addition to 119 specialist skills, the catalogue and eight same-session role prompts (three network, three security, two testing/performance). The separate [NetBird API connector](NETBIRD-API.md) is also registered by the root manifest. Neither extension starts model calls, background processes or infrastructure connections at startup.

If you previously registered only skill directories manually, use a single local `packages` entry instead (see examples/pi-settings.json) so extensions and prompts are discovered too. Resolve duplicate older copies under ~/.agents/skills deliberately.

To keep skills/prompts but disable executable orchestration, disable this extension in `pi config`, or use a package resource filter:

```json
{
  "packages": [
    { "source": "/absolute/path/to/devops-skills", "extensions": [] }
  ]
}
```

Do not combine this with a duplicate registration of the same package. Existing active runs are cancelled during shutdown/reload and before session switch, fork or tree navigation (conservatively, even if another extension later refuses that navigation).

## Tools and commands

| Interface | Function |
|---|---|
| `ops_agent` | Run one allowlisted ECC role in an independent, tool-free worker |
| `ops_workflow` | Run a validated DAG of analysis steps |
| `ops_runs` | List bounded in-memory run/step status metadata, without evidence or worker text |
| `ops_cancel` | Request cancellation by run id |
| `/ops-status` | Show current run status |
| `/ops-cancel <id>` | Cancel a run |
| `/ops-cancel all` | Cancel all active runs |

The existing `/network-architect`, `/network-troubleshooter` and `/network-config-reviewer` commands remain **same-session prompts**. They are not silently converted into background workers. Ask the parent model to call `ops_agent` or `ops_workflow` for separate execution.

Initial request example:

> Use ops_agent with role network-troubleshooter to analyse this synthetic scenario: a switch uplink CRC counter rose from 10 to 900 in five minutes. Provide hypotheses and evidence requirements, without contacting devices.

Workflow example:

> Read workflows/network-review.json and submit its steps and evidence to ops_workflow. This file contains synthetic data only. Do not execute infrastructure commands.

The JSON file is data; it is not auto-run by opening the repo. The extension does not read arbitrary workflow files itself. The parent can read a file with its existing tools when authorised and submit the bounded data to the tool.

## Approval and data handling

Each run requires a **real host UI confirmation**. Without TUI/RPC dialog support, invocation fails closed before calling a worker. There is no auto-approve flag or unattended execution mode. The run's abort signal and timeout are also passed to the host dialog, so cancellation/deadline can dismiss pending approval instead of leaving an orphaned prompt.

The confirmation names roles/tasks, exact plan hash, model/provider, evidence size, limits and potential provider cost. A single approval covers the submitted analysis DAG only, not future runs or infrastructure changes. The approval prompt truncates long task previews; inspect the submitted JSON separately before approving a long plan. Edits to caller-owned objects after submission cannot alter the normalised plan.

The extension sends task/evidence and selected dependency results to the **currently selected model through the parent's authenticated registry**. It does not copy credentials to prompts, files or child environment variables and cannot choose a different provider in a workflow step.

Evidence must already be redacted and approved for that provider. Tool results, the parent session and model output may be stored in normal Pi transcripts or provider logs. No heuristic redactor can guarantee arbitrary input is secret-free, so this extension does not claim one. Do not submit API keys, complete unredacted configurations or personal data without an approved policy.

The extension's registry stores status metadata only, is bounded to 30 records and is lost on reload/restart. There is no separate append-only durable audit log, crash recovery or resumable workflow. Use Pi session evidence plus an approved external change/audit process where retention is required; do not treat the in-memory registry as that process.

## Execution contract and limits

- Roles: network-architect, network-troubleshooter, network-config-reviewer only.
- 1–8 steps per run, unique ids, existing dependencies, no cycles.
- 2 active runs, at most 2 concurrent workers per run (4 total).
- 3-minute deadline per run, including approval time. Cancelled or late results never change a settled run to success.
- Task <=16 KiB; shared evidence <=64 KiB; combined worker payload <=256 KB.
- Requests cap model output at 4096 tokens; actual provider semantics still apply. This is not an exact currency budget.
- At most one application-level model request per worker, enforced before transport, and at most two assistant messages including error responses. Tool-call attempts cannot trigger further model requests. Provider-internal retries are outside this application-level request count; no tools are available.
- Raw worker output <=32 KiB, strict JSON with status/summary/findings only.
- Non-JSON, invalid schema, incomplete/model-error response or thrown failure marks the step failed.
- `blocked` or failed dependencies prevent dependent tasks; independent tasks may still complete. Workflow success requires every step to succeed.
- Outputs are bounded for the parent response, with truncation/omitted-finding counts. If JSON encoding still exceeds 64 KiB, the tool returns explicit truncation plus status metadata only; use smaller runs to retain findings. The extension does not persist raw worker transcripts separately.
- Cancellation signals reach the real Pi core worker. Cancellation of an external provider is best-effort: an in-process extension cannot force a remote service to stop billing or guarantee an uncooperative transport has terminated.
- Structured worker findings remain untrusted model output, never authorisation to execute a recommendation.

## Optional persistent planning

[Planning with Files](../integrations/planning-with-files/README.md) can be registered separately to keep task plans, findings and progress in the project's filesystem. The parent session owns these files and records worker results through its normal tools. Workers remain tool-free; their run registry is not made durable or resumable. `/plan-execute` activates planning hooks only and does not replace the real approval dialog for `ops_agent`/`ops_workflow`. Start with `notify` and do not enable periodic loops without reviewing their cost and lifecycle.

## Tests and release evidence

Run the dependency-free engine tests:

```bash
npm test
```

For the actual Pi loader/core integration tests, point to the installed host SDK directory:

```bash
PI_SDK_ROOT="$(npm root -g)/@earendil-works/pi-coding-agent" npm run test:pi
```

For a non-npm Pi installation, use the actual SDK package directory instead. The test harness uses the host's Jiti and model stream types; it deliberately does not install a second Pi runtime into this repository.

Recorded local results: **29 engine tests and 20 Pi integration tests passed** on Node 22.23.1 / Pi 1.2.0. Tests cover dependency validation, concurrency, denial, approval failures, no-UI rejection, invalid output, independent contexts, zero child tools, parent transport routing, token cap, cancellation, shutdown, bounded metadata and actual multi-step execution using synthetic model responses. They do not call a paid provider or access real infrastructure.

The same integration suite and type check also passed using a fresh official Pi 1.2.0 npm SDK installed into a temporary directory with lifecycle scripts disabled, matching the supplied GitHub Actions workflow. This is not a full interactive clean-machine certification. CI is configured in [.github/workflows/test-orchestration.yml](../.github/workflows/test-orchestration.yml), with read-only repository permissions and SHA-pinned official checkout/setup-node actions. No provider secrets are needed by CI.

The extension also passed strict TypeScript checking with TypeScript 5.9.3 against the installed Pi 1.2.0 declarations. Its shared JavaScript engine is covered by runtime tests; TypeScript checking does not claim full static proof of that module.

These results validate the scoped implementation, **not universal production readiness or independent security certification**. Live provider authentication/error modes, RPC approval UI, Windows/macOS runtime behaviour and real network operations have not been certified here. Before granting operational use, confirm your provider/data policy and perform an approved real-model run with synthetic evidence. No production credentials are required for that first run.
