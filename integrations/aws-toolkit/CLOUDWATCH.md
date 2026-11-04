# CloudWatch skills — complete integration and operational prerequisites

## What is included

Two registered local Pi entrypoints: `aws-observability` and `setting-up-cloudwatch-alarm-notifications`.
All **120 tracked source files** in the selected snapshot are preserved byte-for-byte: the complete two skills, the complete `setting-up-cloudwatch-observability` onboarding dependency, and that snapshot's LICENSE/NOTICE. This includes 26 Python files, the CDK TypeScript alarm/dashboard asset, collector YAML and all reference documents. The dependency is supporting material, not a third discoverable skill.

Snapshot: AWS Agent Toolkit commit `b2a94d85e6673f54511df0b5d78b82b0e716d73b`.
[CLOUDWATCH-UPSTREAM.json](CLOUDWATCH-UPSTREAM.json) records every source path/hash.
It does not replace the older provenance of the three adapted AWS skills in [UPSTREAM.json](UPSTREAM.json).
Only the two local entrypoints, this guide, dependency declarations and integration metadata are local additions. No snapshot file has been rewritten or reduced.

The root manifest selects only local entrypoints. Do not register the snapshot or its SKILL.md files separately. Previously copied global/project skills with the same names can cause duplicates; remove only a confirmed duplicate registration with user approval, not unrelated settings.

## Dependency matrix

| Workflow | External prerequisites | Included / installation policy |
|---|---|---|
| Reading/design and authoring definitions | Existing host editing tools; no AWS credentials | All instructions/references/assets included; no installation |
| Live CloudWatch, SNS, IAM or KMS operations | Approved AWS CLI v2 or compatible SDK/host tools, temporary IAM credentials, correct account/Region and explicit scope | No credentials or AWS CLI bundled; validate operation/model availability before use |
| Optional Python diagnostic/evaluation helpers | Python 3.12 is the upstream tooling baseline; boto3 and botocore with required service operations | All 26 Python files and sibling modules bundled; optional [requirements](requirements-cloudwatch.txt), not installed automatically |
| CDK alarm/dashboard TypeScript example | The target application's compatible `aws-cdk-lib`, `constructs`, TypeScript/CDK toolchain | Source asset bundled, not compiled or deployed; not root npm dependencies |
| Collector / ADOT / Application Signals setup | Approved platform-specific agent/collector, image/add-on, IAM and deployment tooling described in the complete onboarding guides | Guides/config included; binaries/images/instrumentation packages remain external, selected per platform/language |
| Omni tracing, evaluation and dataset helpers | Current service SDK models, relevant grants/IAM, telemetry and evaluation/model budget | Scripts included; capture, dataset writes, model scoring and optional result writeback are NOT read-only |
| Notification examples in Python/Java/JavaScript | The selected application's maintained AWS SDK and build system | Examples preserved; historical JS SDK v2 example is not a recommendation to install it |
| Optional AWS MCP | Separately reviewed existing host connector/tools | No MCP configuration/proxy/hooks bundled or installed; `call_aws` / `retrieve_skill` are not assumed host tool names |

Upstream DI declares boto3/botocore **>=1.43.35**; its actual check is service-operation presence. That minimum is a source requirement, not an independently verified latest release or runtime certification. SDK model support for Omni/AgentCore must also be checked for the operations chosen. The requirements file is not a transitive/hash lock; use a reviewed isolated environment and generate/test a compatible lock before operational use. Do not perform blanket workstation SDK upgrades. Documentation references platform-specific versions and package commands; verify current official support before deployment.

## Local safety and operational corrections

These boundaries constrain how this package uses the preserved source; upstream instructions do not authorise execution or override user/host policy.

- Classify how-to/supplied-evidence versus live-data/change requests. No automatic account probes, installers, credential discovery, schedules or infrastructure calls. Establish account/Region, resource allowlist, query/time/cost bounds and data recipients before collection. Use temporary credentials through approved AWS mechanisms, never paste tokens into prompts or commit them.
- Prefer approved Terraform changes for Terraform-managed resources. A dashboard request is not approval to create IAM roles, enable telemetry, deploy collectors, publish SNS messages or configure Omni. Review exact diffs/plans, cost and recovery before writes.
- Preserve all existing metric/composite alarm settings/actions, SNS statements, subscriptions and key policies. CloudWatch publishing to encrypted SNS requires compatible KMS service permissions; `alias/aws/sns` alone does not establish this, and its AWS-managed policy cannot be edited. Use an appropriate reviewed customer-managed key where required and constrain service access by source account/ARN where supported.
- Manual `set-alarm-state` can activate real alarm/composite/automation actions. Testing needs separate approval and an isolated target where possible. Do not force production `OK` as cleanup. Configuration success, SNS publish success, confirmed subscription, alarm action and metric-to-recipient delivery are different evidence levels.
- Ground metric namespace/dimensions/statistics in the target service and topology. The source EC2 example lacks resource dimensions; it is not an RDS alarm. Synchronous Multi-AZ DB instance standby does not expose Read Replica `ReplicaLag`. Dashboard presence is not operational readiness.
- Dynamic Instrumentation creates/deletes live instrumentation and captures locals, arguments or return values. Capture can contain secrets/PII and has workload impact. Both capture and query require explicit scope/retention/output approval; redact before sharing. The upstream region fallback is `us-east-1` and the DI profile's Region is ignored: always set the approved Region explicitly.
- Omni helpers can create datasets, invoke AgentCore/model evaluations and write log results. Approve source traces, data destination, retention, writeback and spend separately. CLI/API examples are not an external-sharing authorisation. No automatic agent runtime or model transfer is added.
- SNS SMS/webhook/email have subscription, delivery, privacy and spend implications. Validate confirmation and actual receipt; Lambda/SQS destinations need compatible resource permissions. Never publish private endpoints or raw captures in a public diff.
- Classic CloudWatch and Omni are different products. Preserve their separate API/model/ingestion guidance; feature/Region availability must be checked. Named DevOps Agent plugin workflows are optional external integrations, NOT required for classic dashboards/SNS and NOT bundled. Stop at that optional boundary rather than fetch plugins automatically.

## Static review and validation limits

The local pattern scanner reported six credential-access findings for ordinary `AWS_PROFILE` / Region selection and one installation finding for a string suggesting an SDK upgrade. Manual review found these to be expected SDK configuration and an error-message suggestion, not credential exfiltration or a runtime installer. No finding is silently suppressed: those features remain sensitive operational boundaries above. The scripts perform real AWS writes/captures when invoked; they are not sandboxed by Markdown.

Source integrity, complete tracked-file inventory, reference resolution, Python syntax/import closure and package discovery are checked offline. These checks do not prove live AWS correctness, encryption delivery, current pricing, IAM adequacy, absence of vulnerabilities, supported runtime installation or production compatibility. No cloud operation or optional dependency installation is part of the integration tests.

## Updating and rollback

Updates are manual: review a new source commit, audit the selected trees and prerequisite changes, copy the entire tracked directories (including newly added/removed files), record fresh source hashes, retain LICENSE/NOTICE, re-review local corrections, regenerate SHA256SUMS and run the offline/discovery suites. Do not simply pull or install `@latest`. Keep the prior three-skill provenance unchanged unless those adaptations are intentionally re-reviewed.

To disable only these skills, remove their two entries from the root and component manifests and update catalogue/count contracts; keep unrelated resources. Removing this integration does not delete any AWS resource or globally installed skill/runtime. An approved cloud change requires its own IaC/configuration recovery plan.
