# Reproducible AWS cost analysis

Adapted from AWS Agent Toolkit cost-audit/deterministic-calculations guidance. Apache-2.0; copyright Amazon.com, Inc. or its affiliates. Local changes: decimal arithmetic, partial-data and financial-approval rules. See the integration LICENSE, NOTICE and UPSTREAM.json.

## Evidence table

Record source/API/export, retrieval time, account/billing-view scope, region coverage, date range (exclusive end), metric, currency, grouping/filter, pagination completeness and estimated flag. Regional endpoint selection does not necessarily restrict billing data to that region. Apply explicit filters when regional scope matters.

Never treat missing permission, disabled enrollment or exhausted query budget as zero cost. Avoid mixing currencies or periods. Convert with a disclosed rate/date only when requested. Credits, refunds, taxes and support must remain visible or have explicit exclusion labels.

## Calculations

Use an available calculator or a locally inspected snippet with redacted inputs, never an external model to perform arithmetic. No calculation runtime is installed by the skill. If Python is already available, the following is a synthetic example only:

```python
from decimal import Decimal

current = [Decimal("10.25"), Decimal("5.75")]
previous = Decimal("0.00")
total = sum(current, Decimal("0"))
change = None if previous == 0 else (total - previous) / previous * 100
print({"synthetic_total": str(total), "percent_change": None if change is None else str(change)})
```

Zero baseline means percent change is undefined, not an invented percentage. Keep precision through calculations; round at presentation with an explicit rule. Separate recurring monthly estimates from one-off migration/egress/query costs. Do not sum annualized and monthly values or commitments and rightsizing recommendations that overlap.

## Audit sequence

1. Monthly drivers by service and requested account/tag scope.
2. Comparable period-over-period change, accounting for partial months and daily run rates.
3. Existing optimization recommendations, including confidence and lookback period.
4. Idle-resource candidates: validate ownership and recovery needs before recommending removal.
5. Commitment utilization and coverage, contractual limits and forecast uncertainty.
6. Service-specific candidates, including performance, durability and security trade-offs.
7. Report observed figures separately from estimated savings, with reproducible calculations.

A proposed resource change includes baseline, owner, approval, backup/rollback, verification and expected bill impact. Cost optimization must not weaken required encryption, backup, availability or audit retention. Actual savings require later billing evidence; a recommendation is not a measured outcome.
