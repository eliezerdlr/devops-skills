---
name: setting-up-cloudwatch-alarm-notifications
description: "Complete CloudWatch alarm notification procedures using SNS topics, encryption, policies and subscriptions. Preserves full upstream examples with local KMS, existing-configuration, delivery-test and change-approval safeguards."
---

# CloudWatch Alarm Notifications — complete source with local corrections

Apache-2.0 — Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
Local addition: this Pi entrypoint and the safeguards below. Original files are unchanged.
See [provenance](../../CLOUDWATCH-UPSTREAM.json), [LICENSE](../../LICENSE) and [NOTICE](../../NOTICE).

Read [dependencies and operational corrections](../../CLOUDWATCH.md), then the complete [upstream skill](../../upstream/cloudwatch/skills/specialized-skills/operations-skills/setting-up-cloudwatch-alarm-notifications/SKILL.md) and its linked procedure. Resolve upstream references against that source directory.

## Local workflow and corrections

1. Confirm account, Region, alarm/resource identifiers, notification protocol and recipients, ownership/IaC, allowed costs and execution scope. A design request never authorises AWS calls. Use available approved tools; the upstream `call_aws` name is not a guaranteed host capability. Missing tools must be reported, not silently installed.
2. Inspect existing alarms, SNS attributes/policies/subscriptions and KMS permissions only within approved collection scope. Preserve all settings and action lists. Use the matching metric/composite alarm API; the generic `put-metric-alarm` example is not a universal update.
3. Review encryption end to end. Do not blindly select `alias/aws/sns`: CloudWatch publishing to encrypted SNS requires appropriate KMS service permissions, which an AWS-managed key policy cannot be edited to add. Use a suitable customer-managed key with reviewed service permissions where required. Scope SNS/KMS policies to the intended topic/source account/alarm, retain legitimate existing statements and verify current AWS guidance.
4. Plan changes in Terraform where the resources are Terraform-managed; obtain explicit approval for topic creation, policy/key changes, subscriptions and alarm updates. No direct CLI writes that silently introduce drift. Never print private recipient addresses or secrets in shared reports.
5. Email/HTTPS confirmation, SMS sandbox/Region/spend restrictions and Lambda/SQS resource permissions require their own validation. A successful subscribe response or encrypted topic does not prove delivery.
6. `set-alarm-state` can trigger existing SNS, automation and composite-alarm actions. Obtain separate approval of the exact alarm, all affected actions, recipients and test window. Prefer a dedicated test alarm/topic. Never force a production alarm to `OK` merely as cleanup; manual state resets are not a metric-to-delivery test.
7. Distinguish configuration readback, publish/subscription delivery, alarm-action delivery and real metric evaluation. Confirm actual receipt and restore only approved configuration changes; do not delete shared topics, keys or subscriptions automatically.
8. Upstream language examples are historical illustrations, not drop-in production code: the Python example uses `AWS/EC2` without resource dimensions, while the JavaScript example uses AWS SDK v2. Use the correct service/dimensions and maintained SDK in the target project.

No SDK, MCP configuration, AWS credentials, schedule or cloud resource is installed or created by loading this skill. Use `aws-observability` for complete dashboard and metric/alarm design.
