# Resume a selected task

**Local adaptation for DevOps Skills.** Uses explicit Graphify findings when present; Apache-2.0 notices at [NOTICE](../NOTICE).

## Start small

1. Confirm project, branch/worktree and which task to resume. If multiple plans exist, ask for the intended plan; do not pick the newest blindly.
2. Read the selected existing handoff: goal, decisions, verified progress, blockers, files in progress and next action. Target about 1,000–1,500 tokens, not every plan/log.
3. Reuse [Planning with Files](../../planning-with-files/README.md) files if already enabled, or the handoff in [TC Tracker](../../../skills/engineering-skills/tc-tracker/SKILL.md). Do not activate its hooks, change its mode or create duplicate state just to resume.
4. Compare the recorded revision/files with current Git state and relevant test evidence. Report uncertainty; a saved “tested” status is not proof the current revision passed.
5. Only if context is missing, read a relevant saved finding or follow [work memory](../skills/graphify/references/work-memory.md) for lessons. Graphify is not required to read the existing handoff.
6. Query the graph only for a concrete remaining code relationship, using [bounded queries](../skills/graphify/references/querying.md). Otherwise continue with selective source reads.

## At the next milestone

Update the same task's existing handoff with: verified progress, decisions with rationale, evidence paths/revision, blockers and ordered next steps. Keep logs and large reports behind references. Only the parent agent owns shared task state.

Do not store secrets or carry infrastructure approvals across sessions. Do not restart interrupted workers or replay deployment commands automatically.

**No session collector exists in this integration.** These instructions do not scan transcripts, install a session-start hook or guarantee automatic recall. When opening a new window, explicitly request resumption of the chosen task.
