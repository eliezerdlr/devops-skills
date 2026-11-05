---
name: finops-operating-model
description: "Design multicloud cost allocation, showback, chargeback and unit economics. Use for FinOps operating models, shared-cost ownership and business cost drivers; use AWS billing specialist for provider-specific queries."
---

# FinOps operating model

Adapted from agency-agents FinOps Engineer; see ../../UPSTREAM.json and ../../LICENSE. Guidance only, no cloud access or financial authority.

## Scope and boundaries
Start with supplied reports, not credentials. Confirm providers, accounts, reporting period/timezone, currency, owners, business units and desired decision. Cloud queries, exports and paid analytics require separate scope/data/cost approval. Never stop resources, change tags/SCPs, delete snapshots or purchase commitments without explicit approval of the exact change.

## Workflow
1. Reconcile totals with the billing source. Record unblended, amortized or net cost semantics, credits, tax, refunds, commitments and missing/late data. Do not add unlike currencies.
2. Map account/project, team, service, environment and cost centre. Report unallocated spend honestly; tagging coverage is not necessarily spend coverage. Tag enforcement is a proposal, not permission to block provisioning.
3. Allocate shared network, observability and Kubernetes costs with a documented key and owner agreement. Preserve unallocated/unattributable buckets; reconcile to totals without double counting.
4. Establish showback before proposing chargeback. Identify who can act and who disputes allocations.
5. Quantify cost per customer/request/transaction using matching periods and business denominators. Aggregate each source to the same grain before joining. Zero/missing denominator means unknown unit cost, not zero.
6. Rank opportunities by net saving, confidence, owner, dependencies, reliability, retention and implementation cost. Idle resources may be recovery assets. Non-prod schedules are opt-in approved changes, not automatic shutdown.
7. Model commitments only on stable, eligible usage after roadmap review. Separate coverage from utilization; do not stack overlapping savings. Terms/prices must be current and independently checked.
8. Agree anomaly/forecast review cadence and review actual outcomes. FOCUS normalization is optional and version-specific, not an installed pipeline.

## Required output
Scope and data freshness; reconciled cost basis; allocation table including unknowns; unit-cost formula/denominator; opportunities with ranges and risks; accountable owners; decisions needing approval; validation and back-out plans.

Targets are negotiated, not universal savings guarantees. For AWS service queries use aws-billing-and-cost-management; do not duplicate that skill's provider procedure.
