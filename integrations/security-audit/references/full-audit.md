# Explicit full audit — Pi bridge

**Local adaptation of Cloudflare security-audit guidance; MIT, see [LICENSE](../LICENSE).** This bridge does not replace the upstream evidence, budget or execution requirements.

## Gate before starting

Read the complete [upstream SKILL.md](../upstream/security-audit/SKILL.md) before creating outputs or launching workers. Confirm explicit audit/report intent, target, source revision/dirty state, scope, profile, output and budget. Use the upstream cost gate before reconnaissance: quick still has four baseline reconnaissance calls, critic/validation reserves and a hunter wave.

Do not silently reduce independent checks to fit a small budget. Offer a narrower scope or focused guidance if the full workflow is unaffordable. An invocation budget is not an exact token/currency cap; agree a separate spend limit if the host supports it.

## Host mapping

- Parent: current coordinator, sole writer of shared metadata/ledger/findings/reports.
- Upstream Task tool: the host's actual separate-session delegation mechanism.
- Upstream research/general: abstract read-only exploration and bounded investigation roles; choose existing equivalent templates after checking their actual tools.
- Hunters, candidate verifiers and final record verifiers: separate workers as required by the selected upstream profile. Coverage critics assess gaps, not vulnerability truth.
- Slash prompts in this package: convenient same-session instructions, **not** independent workers or permissions.

Supply only the assigned domain blocks, source paths and evidence. Do not expose secrets or unrelated histories to workers. Respect the profile's independence rules, including quick's permitted reuse; never pretend a same-session persona is an independent verifier.

## Six phases, not an invented shortened audit

1. [Reconnaissance](../upstream/security-audit/RECONNAISSANCE.md): architecture, controls, surfaces, prior runs and deterministic ledger.
2. [Hunting](../upstream/security-audit/HUNTING.md): assigned units, focused domain blocks, structured results and coverage critics. Start with the relevant [attack classes](../upstream/security-audit/ATTACK-CLASSES.md).
3. [Candidate validation](../upstream/security-audit/VALIDATION-AND-REPORTING.md): fresh reviewer tries to refute each candidate.
4. Structured findings: use [report-schema.json](../upstream/security-audit/report-schema.json) and both validators.
5. Independent record verification and revalidation after material replacements, as required upstream.
6. Derive reports from verified records/ledger, disclosing deferred, blocked and out-of-scope areas.

Read complete relevant phase instructions before executing them. Do not load all companions into every worker. Prior findings are not proof that current source is unchanged or secure.

## Execution unavailable is not permission to weaken controls

Full audit can inspect source without running the target. If a decisive check requires target execution, enforce every upstream sandbox control or keep that fact unresolved. This integration does not implement OS isolation or safe promotion of target-generated evidence. Without the required promotion controls, do not copy scratch artifacts into retained evidence; use current source citations and record the blocker.

No live/shared endpoint probing, dependency fetches, production changes or paid service experiments. No changes to target source. The reviewed validator scripts process parent-owned report JSON separately; they do not run the target.

## Outputs and completion

Use a new approved directory outside the target by default. In-target output requires explicit selection and verified VCS ignore coverage. Parent owns `run-metadata.json`, `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, `FINDINGS-DETAIL.md` and `NEEDS-VALIDATION.md`; isolated worker scratch/artifacts must follow upstream rules.

Resolve the validator paths against this integration, never the target checkout. Run the bundled `validate-findings.cjs` and `validate-coverage-ledger.cjs` on approved regular JSON files (commands in [README](../README.md)). Schema/ledger validity is not independent verification or proof of complete coverage.

Terminal state: all required artifacts and checks completed, or explicit `incomplete` metadata and a report of the exact gaps, according to upstream. Never announce “no vulnerabilities” as “secure”, erase rejected records to improve the result, or carry infrastructure authorisation across runs.
