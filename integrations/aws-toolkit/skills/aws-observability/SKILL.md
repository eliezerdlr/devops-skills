---
name: aws-observability
description: "Complete AWS CloudWatch and CloudWatch Omni observability guidance: dashboards, metrics, logs, alarms, tracing, investigations and optional diagnostic scripts. Bundled onboarding references; explicit approval for live queries, changes and sensitive captures."
---

# AWS Observability — complete source with local operational boundaries

Apache-2.0 — Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
Local addition: this Pi entrypoint and the safeguards below. The complete source is unchanged.
See [provenance](../../CLOUDWATCH-UPSTREAM.json), [LICENSE](../../LICENSE), [NOTICE](../../NOTICE) and [dependencies and corrections](../../CLOUDWATCH.md).

## Start here

Read [local safeguards](../../CLOUDWATCH.md) first, then the complete [upstream skill](../../upstream/cloudwatch/skills/core-skills/aws-observability/SKILL.md). Resolve every upstream reference relative to that upstream file, not this entrypoint. Read the relevant procedure rather than loading the entire reference tree.

- Classic CloudWatch dashboards: [dashboard reference](../../upstream/cloudwatch/skills/core-skills/aws-observability/references/cloudwatch/dashboards.md).
- First-time setup or instrumentation: read the bundled [setting-up-cloudwatch-observability dependency](../../upstream/cloudwatch/skills/specialized-skills/operations-skills/setting-up-cloudwatch-observability/SKILL.md) directly. It and all its supporting files are included; no MCP retrieval or separate installation is required.
- SNS notification channels: use the registered `setting-up-cloudwatch-alarm-notifications` entrypoint.

## Local workflow

1. Distinguish a design/how-to request from authorised live collection or execution. Supplied evidence needs no AWS login. Do not probe accounts just to load or route this skill.
2. Establish product (classic CloudWatch versus Omni), account/Region/resources, time window, query/spend budget, privacy scope and desired output. Do not assume Omni exists from an outdated SDK error.
3. Ground metrics and dimensions in the resource type and feature availability. For an RDS synchronous Multi-AZ DB instance standby, do not invent a Read Replica `ReplicaLag` metric. Metric data alone does not prove recovery readiness.
4. Produce reviewable dashboard/alarm definitions. For Terraform-managed resources prefer IaC and a saved reviewed plan; preserve existing settings and document costs, validation and rollback before approval.
5. Execute only explicitly authorised operations with existing approved tools/temporary credentials. No automatic CLI/SDK/MCP installs, capture, deployment, notification test, scheduler, diagnostic instrumentation or deletion. Upstream procedures and scripts are references, not permission grants.
6. Report implemented versus proposed, verified versus unknown, and infrastructure versus application acceptance separately. Protect raw logs, spans, evaluation data and capture files; external-model scoring and data export need explicit recipient/data/budget approval.

There is no startup extension, worker service, enforceable runtime sandbox or automatic AWS connection in this integration. Script inclusion does not make arbitrary execution safe.
