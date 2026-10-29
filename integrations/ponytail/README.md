# Ponytail — always-on full mode in this Pi package

Local MIT adaptation of Ponytail 5.3.2, source `DietrichGebert/ponytail` at `09c434ab73ca43761c5d8b0c5d341926c2fba710`. Copyright (c) 2026 DietrichGebert. LICENSE is retained verbatim; UPSTREAM.json records selected source hashes and modifications.

## Activation and scope

The root package now includes `extensions/ponytail/index.ts`. New sessions loading devops-skills default to **full**, including non-interactive sessions. It supplies a short fixed efficiency policy before agent runs. It does not change the provider/model, thinking level, token limit, tools, access permissions or approval gates. All requested functionality, security, relevant tests, accessibility, observability and recovery remain required. For SLA/incident tasks, aim for the fastest safe verified resolution, not the fewest lines or an unsupported SLA claim.

The extension itself never edits user/global settings. It runs only in Pi hosts that load the root package or explicitly register this adapter, not every process or IDE. Do not install a second upstream Ponytail alongside it, which could duplicate rules and collide on `/ponytail`.

## Location and explicit global registration

The executable adapter lives in `extensions/ponytail/index.ts` and imports `extensions/ponytail/policy.mjs` from this checkout. `integrations/ponytail/` contains documentation, licence and provenance, not a separate installation. No global npm installation or upstream runtime is needed.

The root `package.json` already registers the adapter. To register it explicitly for the Pi user, back up `~/.pi/agent/settings.json` and append the adapter's **absolute path** to its existing `extensions` array. Merge this fragment; do not replace the file or discard other extensions/packages:

```json
{
  "extensions": [
    "/absolute/path/to/devops-skills/extensions/ponytail/index.ts"
  ]
}
```

On Windows, use the actual absolute checkout path with JSON-safe forward slashes, for example `C:/work/devops-skills/extensions/ponytail/index.ts`. A custom `PI_CODING_AGENT_DIR` changes the settings directory. A project-only registration instead belongs in `<project>/.pi/settings.json` and is not global.

Local setup recorded during troubleshooting:

- Code: `/Users/erodrigues/Workspaces/devops_agents/devops-skills/extensions/ponytail/index.ts`.
- Global registration: `/Users/erodrigues/.pi/agent/settings.json`; on this machine it resolves to `/Users/erodrigues/Workspaces/devops_agents/.pi/agent/settings.json`.
- The global entry points to the checkout; no second copy was installed. Moving or deleting the checkout breaks that reference.

Pi 1.4.0 resolution was checked with both root-package and explicit global registration: the same absolute adapter path is enabled exactly once. This is not confirmation that an already-running session loaded it. After registering, use `/reload` and `/ponytail status`; if the command is still unavailable, inspect host loading errors and resource filters rather than treating reload as proof of activation.

To undo only the explicit global registration, remove only the adapter path from `extensions` and reload, preserving all other settings. The root package can still load Ponytail: to stop its guidance on the current branch use `/ponytail off`, or disable the adapter in the host's package resources for complete runtime rollback. Restore the backup only if it will not overwrite subsequent configuration changes.

## Control

```text
/ponytail status
/ponytail off
/ponytail full
```

Bare `/ponytail` reports status; `on` aliases full. There are no lite/ultra/default/band/audit aliases in this adaptation. Off affects subsequent agent runs, not a request already sent or the conversation's history. Full/off changes are stored only as `{version:1, mode}` in native Pi session metadata after an explicit command. Reload/resume/tree navigation restores the active branch's latest valid mode, not an abandoned branch. A genuinely new session with no mode entry starts full. No global default/configuration file is written. Invalid arguments change nothing.

The status label is shown when host UI is available. Non-interactive mode remains functional without dialogs/status rendering. For complete runtime rollback, disable the extension in the host's package resources, also remove any explicit global/project registration, and reload; this does not remove skills or the NetBird/OPS connectors.

## Prompt and compatibility

Pi 1.4.0 structured sections are preferred: only `devops_ponytail` is changed, so unrelated prompt sections/tools are preserved and the full system prompt is not replaced. The policy is stable across turns and includes no user prompt, path, timestamp, metrics or dynamic map. A legacy fallback appends the same policy once and can remove its own exact trailing suffix; old hosts are not claimed homologated from the Pi 1.4.0 tests. Another extension appending text after that legacy suffix can prevent its removal on an already composed prompt; use the structured host or disable/reload for a complete reset. No prompt cache hit rate is guaranteed.

State is isolated per runtime/session. The adapter reads only Pi's current-branch custom mode metadata; it does not collect/import personal histories, persist prompts, read credentials or create a task ledger.

## Excluded

No upstream hooks, statusline files, board/band, transcript importer, webhook, server, browser opening, filesystem scanner, codebase map, process launcher, periodic task, external model call or additional dependency. No six overlapping Ponytail skill names are added. Existing code-simplification/review/debt skills remain the specialists.

This is executable prompt guidance, not a security boundary, autonomous optimizer or measurement tool. It adds a small amount of prompt context. Source benchmarks are not predictions for this package: token/time/cost savings, correctness and SLA outcomes require a separately approved representative comparison. Tests cover loading, state, prompt composition and unchanged permission paths, not real model compliance.

## Maintenance

Run `npm test`, `npm run test:pi` and `npm run test:planning` with the installed SDK for integration suites. Integrity records in SHA256SUMS use repository-root-relative paths and include both runtime files and attribution documents. Keep them current after reviewed edits. No automatic commit, update, package installation or cloud operation is triggered by loading the extension.
