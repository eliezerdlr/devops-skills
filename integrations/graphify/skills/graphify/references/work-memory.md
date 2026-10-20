# Explicit work memory

**Modified for DevOps Skills**, adapted from Graphify 0.9.93 save-result/reflect guidance. Apache-2.0; see [NOTICE](../../../NOTICE).

## What to retain

Only a selected, useful finding: question, concise answer, source references, verification date/revision and known limitations. Never store credentials, personal data, full transcripts, live inventories or authorisation to change infrastructure.

Use the existing plan/TC record for goal, decisions, blockers and next actions. Graphify memory is optional evidence, not a second task tracker or replacement for human review.

## Save after review

Confirm the project and approved `graphify-out/memory/` destination, with the same output/symlink checks and child-process environment as [querying.md](querying.md). Saving writes plaintext Markdown; check permissions/retention before proceeding.

Pass arguments as a list, not interpolated shell text. Use exact node IDs from the graph for `--nodes`, not shorthand search terms. If using labels, they must match exactly: `calculate_total` may find `calculate_total()` in a query but will not match that source during reflection. An unresolved citation may be omitted from lessons even when saving succeeds. Verify the saved finding appears after reflection.

Prefer an already approved, redacted answer file (replace `NODE_ID_FROM_GRAPH` with a real ID):

```text
graphify save-result --question "Where is release validation?" --answer-file /approved/redacted-finding.md --nodes NODE_ID_FROM_GRAPH --outcome useful
```

Choose the outcome from evidence, not model confidence:

- `useful`: sources actually answered the question.
- `dead_end`: investigation did not answer it; not proof the path can never matter.
- `corrected`: a prior answer was wrong; include `--correction "verified correction"`.

Do not mark every answer useful or auto-promote repeated model output to policy. Record corrections in the existing task findings as well. When correcting an existing saved answer, use the same original question; creating unrelated duplicates may preserve contradictory entries.

## Read lessons in a later session

After approval for the generated reflection output, using the same process environment:

```text
graphify reflect --if-stale
```

Read only relevant sections of `graphify-out/reflections/LESSONS.md`, under the context budget. Reflection is deterministic and needs no model, but consumes local resources and writes derived files. Sources can become stale; re-check the current repository.

`save-result` persists Q&A; `reflect` aggregates outcome metadata. Semantic incorporation of complete Q&A into the main graph is separate and is not automatically enabled here.

This flow does not capture Pi conversations or automatically run at session start. A new session must be asked to load the selected task handoff/lessons. To delete sensitive memory, remove the approved records and associated derived outputs/caches as required by retention policy; disabling the skill alone does not erase them.
