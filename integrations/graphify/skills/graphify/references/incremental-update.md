# Incremental local update

**Modified for DevOps Skills**, adapted from Graphify 0.9.93 update guidance. Apache-2.0; see [NOTICE](../../../NOTICE).

## Approval and scope

A build/update writes graph, cache and report files. Confirm the trusted project/worktree, permitted corpus and output before running. Never index the workspace parent or HOME by convenience.

Use `graphify-out/` only after checking it and existing output destinations are not symlinks escaping the approved root. The upstream runtime supports following output symlinks; this skill does not enforce confinement against races or hostile local writers. If uncertain, stop and use a trusted isolated copy.

Exclude secrets, production inventories, measurements and unrelated data. Review project ignore rules; do not edit ignore files silently. Do not assume filtering by filename detects embedded secrets.

## Local structural flow

Use the exact child-process environment in [querying.md](querying.md), an installed 0.9.93 executable outside the project, and the confirmed project as cwd. Commands are examples, not automatic actions:

```text
graphify update . --no-cluster
```

The update path uses local code extraction and structural Markdown where supported. It can create outputs when none exist; runtime validation of this workflow in our environment remains required. No semantic document/media extraction is requested.

If choosing the separate extraction command:

```text
graphify extract . --code-only
```

That command skips document input, including Markdown. Do not report that it mapped all skills. Neither path guarantees complete IaC coverage: YAML/Jinja are documents, and Terraform needs its optional parser dependency.

## Validate before trusting

- Confirm the command succeeded, graph is non-empty, scope is correct and skipped files are reported.
- Check changed/deleted sources and sample relationships against current files.
- Record build time/revision and known coverage gaps in existing findings, not as a new competing plan.
- If a shrink/integrity guard refuses the update, preserve the last good graph and investigate. Do not add `--force` or delete outputs to bypass it.
- For semantic documents, mark the map incomplete/stale and request a separate approved workflow; never silently send files to an available provider.

No watcher, Git hook or background rebuild is installed. Updates are explicit. To undo, restore only approved generated outputs from the pilot backup; never purge source or planning files.
