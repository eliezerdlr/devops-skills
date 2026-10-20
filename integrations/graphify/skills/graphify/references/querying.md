# Querying — bounded context

**Modified for DevOps Skills**, adapted from Graphify 0.9.93 query guidance. Apache-2.0; see [NOTICE](../../../NOTICE).

## Preconditions

Confirm the trusted project/task and pinned external CLI as described in [SKILL.md](../SKILL.md). Locate the graph belonging to that project/worktree; do not query a parent repository's graph by accident. If missing, use ordinary source navigation or ask before creating it.

For every execution, set these variables **for the child process only**, preserving unrelated user configuration:

- `GRAPHIFY_BACKEND=none`
- `GRAPHIFY_NO_AUTO_REFRESH=1`
- `GRAPHIFY_QUERY_LOG_DISABLE=1`
- `GRAPHIFY_OUT=graphify-out`, only after confirming this output root is approved and contains no escaping symlinks.

These settings suppress backend autodetection, skill refresh and query logging; they are not network isolation or a filesystem sandbox. If project/host policy requires network isolation, obtain an appropriate sandbox separately.

## Query only what is needed

From the confirmed project root, run the installed executable with argument lists, not shell-interpolated user questions. CLI examples (the process environment above is required):

```text
graphify query "AuthModule" --budget 1200
graphify explain "AuthModule"
graphify path "AuthModule" "Database"
```

Use identifiers actually present in the project. Matching is lexical: a Portuguese question may need known English symbol names. Do not load the entire vocabulary or graph to translate a question; inspect a small relevant set of names or use selective search.

`--budget` limits query output approximately. Explain/path can also be large; bound the tool output using host limits, or query narrowly instead. No output is not evidence that a component does not exist.

## Verify and answer

1. Check the output identifies the intended graph and plausible sources.
2. Distinguish EXTRACTED / INFERRED / AMBIGUOUS relationships.
3. Read only relevant source spans; the graph is an index, not the final authority.
4. Cite paths/locations and disclose stale/missing data or truncation.
5. Offer to save a useful finding only when it is durable and verified; do not save every model response.

For known graph inaccuracies, audit the raw sources rather than relying on the graph to prove itself correct.
