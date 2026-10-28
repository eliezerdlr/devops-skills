---
name: aws-billing-and-cost-management
description: "Analyze AWS spending, Cost Explorer, budgets, CUR/Athena, rightsizing and commitment recommendations with reproducible calculations. Guidance and read-only evidence first; no automatic AWS setup, resource deletion or purchases."
---

# AWS Billing and Cost Management

Adapted from AWS Agent Toolkit, Apache-2.0. Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. Local modifications: guidance-first operation, bounded queries, explicit financial/change approval, no automatic tools or MCP. Source and hashes: [UPSTREAM.json](../../UPSTREAM.json); licence: [LICENSE](../../LICENSE), [NOTICE](../../NOTICE).

## Boundaries and prerequisites

Loading this skill requires no AWS CLI, account, Python, MCP or network connection. It supplies instructions, not a cost-management service. Actual API evidence requires approved AWS tools and credentials. Do not install, log in, enable services or configure MCP automatically.

Start with guidance or supplied redacted exports. Before cloud queries, confirm account/profile, allowed regions, billing view or linked accounts, period, currency, cost metric, recipients and query budget. Use an existing temporary read-only role; never read credential files or request keys in chat. An existing approved MCP is optional, not a prerequisite or authorization boundary. AWS CLI commands below are examples, not permission to execute.

Read [analysis and calculation rules](references/analysis.md) before calculating or reporting costs.

## Workflow

1. **Establish time and scope.** Determine the current date with a local clock tool; do not guess. Use explicit ISO dates and UTC boundaries where applicable. Cost Explorer's End date is exclusive. Mark current periods as incomplete/estimated and account for billing-data latency.
2. **Select the right evidence.** Cost Explorer for totals/trends; Price List or current official pricing for estimates; existing Cost Optimization Hub/Compute Optimizer recommendations for opportunities; CUR/Athena for approved detailed investigations. Do not enroll an account or create an Athena workgroup to obtain missing evidence without approval.
3. **Collect narrowly.** Start with service-level monthly totals, then only the requested drill-downs. Verify the installed CLI supports parameters using offline help or official documentation. Handle pagination and incomplete data; stop at the agreed query/page/time budget and label partial results. Cost Explorer and Athena queries can cost money even with read-only IAM.
4. **Calculate reproducibly.** Use an available calculator or an explicitly inspected local calculation snippet; prefer decimal arithmetic for currency. Preserve currency, period, metric, account scope and provenance. Distinguish actual API figures from estimated savings; do not invent missing data.
5. **Rank recommendations.** Identify cost drivers, idle-resource candidates, rightsizing opportunities and commitment coverage. “Unattached” does not mean disposable: volumes, snapshots, addresses and logs can support recovery or compliance. Check workload ownership, utilization windows, dependencies, performance and retention needs.
6. **Report, do not apply.** Show evidence, assumptions, one-off versus recurring costs, confidence and next validation. Deduplicate overlapping recommendations; never add mutually exclusive savings. Include financial and availability trade-offs.

## Read-only CLI example

After the user approves the scope, substitute explicit values; do not paste placeholders unchanged:

```text
aws ce get-cost-and-usage --profile PROFILE --region REGION --time-period Start=START_DATE,End=END_EXCLUSIVE --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE
```

Use UnblendedCost only when it fits the question. For commitments, amortized/net metrics can be more meaningful; disclose the chosen metric. Define treatment of Credits, Refunds, taxes and support; do not silently remove them to make results look better. With GroupBy, do not assume the Total field contains the aggregate. Billing-view support varies by API; verify before adding an ARN.

## Changes and commitments

Separate each of these from analysis and obtain explicit approval for account, region, resource, cost and rollback:

- Creating budgets, anomaly monitors, reports or log destinations.
- Enabling Compute Optimizer, Cost Optimization Hub or detailed/hourly data.
- Running billable query workloads outside the approved budget.
- Stopping, deleting, resizing resources, changing lifecycle/retention or storage tiers.
- Purchasing Savings Plans, Reserved Instances or reserved capacity.

Budgets/alerts are not a guaranteed hard spending cap. Commitments may bind spend for years; verify current terms, utilization, coverage, workload forecasts and discount interactions. Do not recommend a purchase solely from a short lookback or claim a return/refund window without checking current terms. “No upfront” still creates a commitment. Analysis approval never authorizes a purchase.

## Deliverable

Provide: scope/time/metric → observed spend and data quality → drivers → non-overlapping estimated savings → risks → proposed approvals and next checks. Redact account identifiers where not needed; billing exports and resource inventories are confidential. Do not upload them or publish reports without approval.

## Official references

- https://docs.aws.amazon.com/cost-management/
- https://docs.aws.amazon.com/cli/latest/reference/ce/get-cost-and-usage.html
- https://docs.aws.amazon.com/compute-optimizer/
- https://docs.aws.amazon.com/savingsplans/

Use `aws-solution-architect` for architecture choices; this skill owns AWS billing analysis, not general multi-cloud FinOps or a payment system.
