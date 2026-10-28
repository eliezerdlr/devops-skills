# Bounded skill evaluation protocol

Adapted from Anthropic skill-creator evaluation, schemas and aggregation concepts. Apache-2.0, Copyright 2026 Anthropic, PBC. Local changes: host-neutral execution, explicit approval/isolation, one layout, missing metrics, validation/test split and no runner. See ../LICENSE and ../UPSTREAM.json.

## Approval before runs

Review the case set and expected outcomes before executing prompts. Agree model/provider/recipient, data scope, permitted tools, isolated output root, concurrency/repetitions, time/token/cost limits, stop conditions and cancellation. Do not assume an installed CLI or subscription authorizes inference. No runner or automatic subagent dispatch is provided. Human review of supplied artifacts can be used without creating new model runs.

For potentially executable skills, a prompt saying “offline” is not isolation. Use approved OS-enforced isolation with network/credentials absent and only necessary tools, or do not execute. A child session with no tools can assess supplied text but cannot validate arbitrary file-generation/operational behavior. The existing OPS roles are intentionally not generic executors.

## Cases and controls

- Start with a small representative set of positives, negative near-misses and failure/edge cases; use synthetic inputs.
- Verify outcomes, not just a filename, keyword or long answer. Include denied/unapproved operations and uncertainty where relevant.
- Freeze the candidate and baseline hashes, fixture set, criteria, model, context, tools and settings. Use identical approved inputs on both sides.
- New skill: baseline is no target skill. Updated skill: baseline is the approved previous version. Ensure the baseline cannot discover the candidate through package/global skills, index text, cached context or shared outputs. If exclusion cannot be verified, label contamination and do not claim a controlled A/B result.
- Use fresh independent contexts per run; do not let candidates see each other's outputs or evaluator answers. Counterbalance execution/review order where useful and keep failures/timeouts, not only successful cases.
- Repeated queries/near-duplicates must not cross dataset partitions. Development data guides iteration; validation data selects a version; a final untouched set estimates generalization. Do not call repeatedly selected validation scores an independent final test.

## Single local layout

This is a local protocol, not compatible-by-assertion with an upstream viewer/aggregator. Use schema_version 1 in metadata. No schema validator or aggregator runtime is shipped.

```text
APPROVED_EVAL_ROOT/
  eval-plan.json
  iteration-001/
    case-001/
      eval_metadata.json
      with_skill/
        run-001/
          outputs/
          grading.json
          metrics.json
      baseline/
        run-001/
          outputs/
          grading.json
          metrics.json
    benchmark.json
    feedback.json
```

All case/config/run IDs are safe local identifiers, never untrusted paths. Create outputs only as needed, refuse existing destinations/symlinks, and keep the workspace outside the distributed/installed skill. If more repeats are approved, increment run IDs consistently. Do not mix direct config/outputs trees with nested run-* trees.

Record `candidate` and `baseline` identities explicitly in eval-plan/benchmark metadata; calculate deltas as candidate minus baseline, never from alphabetical directory order. Example plan: [eval-plan.example.json](../assets/eval-plan.example.json).

## Grading and measurements

Use [review-roles.md](review-roles.md). For each check, record criterion ID/text, status (`pass`, `fail`, `unknown`) and specific evidence. Unknown is not a pass; when calculating a pass rate, disclose the denominator, coverage and how unknowns are handled. Report rubric findings and substantive task completion alongside assertion rates. Do not reward unsafe shortcuts or a plausible answer unsupported by outputs.

Metrics require actual host evidence: model/provider/version, settings, start/end time, duration_seconds, input/output/total_tokens and tool counts if exposed. Missing values are null/unknown, never zero. Keep output_chars separate from measured tokens; do not relabel characters as tokens. Absence of a usage notification is not zero cost. Capture available metadata without assuming every host delivers a particular event shape.

Use an inspected deterministic calculator for numeric aggregation. Compare paired cases and report repeat counts, distributions/variance and incomplete/error runs. Small samples and model judgments do not establish universal improvement, SLA or security. A mean alone may hide regressions in negative cases, cost or latency.

## Review and iteration

Prefer a concise Markdown/JSON report and a host artifact preview, not server startup, arbitrary port cleanup or executable HTML with embedded outputs. Keep prompts and generated data confidential; sanitize exports and never include credentials or private histories. Human feedback should have an explicit state: accepted, changes_requested, skipped or no_response. Empty comments do not imply acceptance.

Freeze acceptance criteria before final testing. Changes should address general causes, not memorize prompts. Revalidate safety/structure and preserve the old version for an approved rollback. Stop when accepted, requested, out of budget or no meaningful progress. Do not auto-apply a description, launch a new sweep or publish results. Unrun evaluations remain labelled unrun; synthetic fixtures are not measured model behavior.
