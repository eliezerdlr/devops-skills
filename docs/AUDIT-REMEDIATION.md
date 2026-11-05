# Remediation of the eleven reproduced audit behaviors

Scope: F01–F10 and F12 from the local global audit. The original audit and reproductions remain historical evidence; they are not overwritten or reused as passing tests. F11 and G01–G04 are separate residual findings, not closed by this tranche. Passing the following regressions does **not** certify the whole package or establish cloud/database/platform readiness.

## Behavior and acceptance matrix

| Finding | Corrected behavior | Inverse/positive regression |
|---|---|---|
| F01 | Target-controlled `noqa: SEC-AUDITOR` and `auditor:ignore-line` never waive code, Markdown or runtime-install findings. | Same fixture with/without either marker retains the finding; fixture strings are not executed. |
| F02 | Resolved symlink containment uses path components, not string prefixes. | External sibling `demo-private` is rejected from `demo`; an internal link remains allowed. |
| F03 | Parser failures produce structured errors and nonzero exits; JSON stdout remains parseable. Unsupported/no-coverage cases cannot become an empty successful scan. | Invalid JSON and all four TOML formats, mixed valid/invalid manifests, no manifest, explicit valid empty JSON, valid structured TOML and unsupported groups/formats. |
| F04 | All six ML/data helpers explicitly return `not_implemented`, `success: false`, exit 1, and create no output. | Each helper is invoked with absent and present synthetic input. This fixes false success, **not** the missing ML implementation. |
| F05 | Failed/incomplete PR or quality analysis yields `not_assessed`, no score, exit 2; supplied invalid reports do not trigger silent fallback. | Error/invalid schemas and CLI reports; successful normalization of the actual bundled quality-checker schema. Positive scores remain heuristics, not release approval. |
| F06 | Upgrade versions come only from an explicitly supplied, ecosystem-scoped offline snapshot. Unknown packages remain visible; no mocked latest versions or advisory feed. | Catalog absent, malformed input, exact ecosystem/name lookup, known/unknown mixed coverage and a positive catalog. |
| F07 | Removing an HTTP method from a retained path is a breaking change and exits 2. | All eight OpenAPI HTTP methods; path metadata is not treated as a method. |
| F08 | Generated `INDEX CONCURRENTLY` scripts have no `BEGIN`/`COMMIT` wrapper and warn that they are non-atomic and require autocommit. | Concurrent-index SQL generation versus ordinary transactional DDL. SQL is never applied in tests. |
| F09 | Backend migration examples use the actual offline SQL-file CLI, not nonexistent live-connection/migrate/dry-run flags. | Documented commands are extracted and run against temporary SQL files, without a database. |
| F10 | Repository keywords are only `candidate`/`not_assessed` leads. Compliance score is null, level `NOT_ASSESSED`, CLI exit 2. | AES/HTTPS words cannot pass controls or certify a repository; JSON output remains parseable. |
| F12 | Static bundle-size indicators include build directories while excluding dependency/vendor trees and symlinks. | A 4096-byte `dist/app.js` contributes 4 KiB; multiple build roots count; source-only iteration retains its exclusions. Not a measured compressed transfer size. |

## Running the gate

```bash
npm test
python3 -B -m unittest discover -s tests -p test_audit_regressions.py -v
```

The standard npm gate runs the 28 Python regression cases through `tests/audit-regressions.test.mjs`. Python **3.11+** is required for the complete gate (stdlib `tomllib`); set `PYTHON` to an interpreter executable path if needed. Missing Python, a failed child or a skipped regression fails the wrapper; no network/dependency installation is performed. SDK/Planning/live-Ghidra suites remain separate as documented in [TESTING.md](TESTING.md).

## Compatibility and deliberate limits

- Dependency scanner exit 2 means incomplete/unassessed coverage or parse errors; exit 0 is not a current vulnerability attestation. TOML is parsed structurally. Unsupported optional/dynamic/Poetry groups and Cargo workspace/target/path declarations fail closed. Regex-only yarn/requirements/Go/Ruby formats are listed as `heuristic_files`, do not count as validated `files_scanned`, and cannot produce complete `status: ok`. On older Python, TOML validation is unavailable and fails closed. The built-in advisory examples are not a maintained live feed.
- Upgrade catalog: `{"schemaVersion":1,"source":"approved snapshot","asOf":"2026-01-01","packages":{"npm":{"example":"2.0.0"}}}`. Its provenance/freshness must be verified separately. `--security-only` is explicitly unavailable without an implemented advisory feed. Unknown/partial coverage exits 2; invalid input exits 1. Filtering candidates also recomputes statistics/plans.
- The security scanner remains static heuristic triage, with false positives/negatives; target comments are not trusted waivers. Findings do not establish malware or compromise. No external advisory/reputation lookup is newly implemented (F11).
- The ML/data skills remain useful as design instructions; their six bundled scripts are **not executable implementations** of monitoring, deployment, RAG, feature engineering, experiments or evaluation.
- No SQL, payload, infrastructure change, paid model call or credential access is performed by this remediation gate. SQL generation tests cannot prove a production migration safe.
- Ghidra host analysis is not an OS sandbox. Previous macOS arm64 benign runtime validation does not establish Windows/Linux/malware safety.
- Residual governance work includes G01 typecheck coverage, G02/G03 documentation consistency and G04 precise UniFi helper attribution review. No blanket “fully functional” or external-audit certification claim is made.

## Rollback

The changes are prepared and reviewed in an isolated sandbox before applying. After a local commit, revert that commit in a clean branch to undo its tracked changes; do not delete private runtimes/configurations or erase the historical audit evidence. Operational deployments, external services and runtime removal require their own authorization and rollback.
