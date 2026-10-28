# Coverage and reporting contract

Adapted from AWS Agent Toolkit review modes and security considerations. Apache-2.0; copyright Amazon.com, Inc. or its affiliates. Local changes: bounded/partial review, no forced cloud changes or uploads, explicit unknowns and non-certification. See integration LICENSE, NOTICE and UPSTREAM.json.

## Inventory

For each included framework item record pillar, question, canonical BP ID if verified, official source URL/version/retrieval date and the reason it is in scope. For a conceptual offline review, use descriptive local labels and mark canonical IDs unverified. Do not invent AWS identifiers.

A full assessment requires an enumerated expected set and exactly one status per item. Check duplicates, missing entries and consistent status vocabulary before claiming completeness. If budget/documentation access ends, report the checked subset and missing remainder. Do not call an unverified inventory complete merely because a generated JSON field says `valid: true`.

## Report outline

1. Confidentiality notice: restrict distribution; no publishing without approval.
2. Workload, business requirements, selected mode and explicit exclusions.
3. Evidence sources and framework version/date; what was and was not queried live.
4. Coverage: expected, evaluated, not-applicable and cannot-determine items. Show per-pillar gaps. If denominator is unknown, say so rather than reporting a percentage.
5. Strengths supported by evidence.
6. Findings: item/ID, observation, evidence file/line or supplied description, status, risk, confidence, suggested action and verification.
7. Cross-pillar trade-offs and prioritized next steps with owner, acceptance criteria and dependencies.
8. Remaining evidence requirements, costs and approval boundaries for follow-up.

Unknowns must not silently count as passes. Any numerical score requires a disclosed local rubric and reproducible calculation; never imply an AWS-issued certification or an official Well-Architected Tool result. RTO/RPO and SLAs require business targets and measured recovery evidence, not inference from IaC alone.

## Data handling

Keep workload evidence local unless the user approves a recipient and purpose. Redact credentials, tokens, private keys, personal data and unnecessary account/resource identifiers. Do not enable CloudTrail/KMS/S3 or change retention as a side effect of report creation. For a requested export, use an approved access-restricted destination and preserve the user's confidentiality requirements; a filename or gitignore is not encryption or access control.
