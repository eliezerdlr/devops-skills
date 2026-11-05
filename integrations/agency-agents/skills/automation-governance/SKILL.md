---
name: automation-governance
description: "Evaluate whether to automate a business or operational process using value, data criticality, dependency risk, idempotency and recovery. Use before designing integrations; does not authorize execution or require n8n."
---

# Automation governance

Adapted from agency-agents Automation Governance Architect; see ../../UPSTREAM.json and ../../LICENSE. Platform-neutral; no n8n or other runtime required.

## Assess before building
Establish process owner, business outcome, manual baseline, frequency, recurring time saved, implementation/maintenance cost, error cost and acceptable risk. Map source of truth, data sensitivity, destinations, authorization, rate limits and external dependency failure modes. Missing evidence can justify DEFER.

## Analytical verdict (not authorization)
Choose APPROVE, APPROVE AS PILOT, PARTIAL AUTOMATION ONLY, DEFER or REJECT, with rationale and uncertainty. APPROVE is an assessment recommendation only: it never substitutes for user approval of writes, installation, paid calls or deployment. Timeouts and unavailable checks are not consent.

## Design checklist
Trigger -> input validation -> normalization -> business logic -> external action -> result verification -> status/audit -> error handling -> manual recovery.
Specify idempotency key and duplicate scope, bounded retries with backoff, timeout, rate limits, reconciliation after uncertain outcomes and human checkpoints. Never retry a non-idempotent write blindly. Define stop/abort conditions and what is irreversible.
Record auth/token lifecycle without token contents; per-system write permissions, data retention, ownership and escalation. Log minimal identifiers, versions and outcomes, not payloads or secrets.
Use existing workflow tools only when available and approved; a diagram is not an implemented integration.

## Acceptance and rollout
Require happy path, invalid input, duplicate/replay, dependency timeout/failure, partial success, uncertain write outcome, recovery and volume tests. Pilot with limited scope and explicit rollback/compensation; preserve a manual path. Monitoring and re-audit on API/schema/volume/owner change are proposals, not background jobs started on load.

## Output
Process summary and baseline; economics with assumptions; risk/source-of-truth map; verdict; architecture; test evidence or missing evidence; permissions and human gates; rollout/abort/recovery; accountable owner and open decisions.
