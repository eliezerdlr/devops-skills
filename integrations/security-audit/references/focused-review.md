# Focused source review

**Local adaptation of Cloudflare security-audit guidance; MIT, see [LICENSE](../LICENSE).**

Use this path for a security question, release/pipeline review or triage of a supplied candidate. It is not a six-phase audit and does not require report artifacts.

1. Confirm the question and smallest relevant source/configuration scope. If facts are missing, ask rather than scanning every repository.
2. Select only the applicable domain blocks from the [skill](../skills/security-audit/SKILL.md). Prefer supply chain/releases and cloud/deployment for DevOps work.
3. Inspect the named trust handoff and relevant protections. Distinguish intended same-user authority, hardening and a real boundary failure.
4. Return the actor/input, affected resource, cited source path, controls considered, concrete result or exact unknown, and smallest effective fix/test recommendation.
5. Do not execute target code or create files. If reproduction is necessary, propose an authorised sandboxed validation plan; do not claim it happened.
6. Do not launch workers by default. A focused independent review can be proposed when the stakes justify the cost, with explicit scope and invocation limit.

If using the upstream verdict vocabulary, `confirmed` still requires the full evidence contract; `needs_validation` is not a bucket for generic checklist warnings and has no severity. Facts requiring unknown deployment/runner/identity settings stay unresolved.

Avoid duplicate specialists: use existing cloud-security/ai-security/security-pen-testing guidance for their focused tools; this skill adds the evidence/validation discipline, not another automatic scanner.
