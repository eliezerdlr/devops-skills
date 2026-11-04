# AWS Toolkit — selected instruction skills and complete CloudWatch source

Three local Apache-2.0 adaptations from [AWS Agent Toolkit](https://github.com/aws/agent-toolkit-for-aws), snapshot `9ab50636d12510dc351ff02fd7966efa4dba4341`:

- `aws-billing-and-cost-management`: FinOps evidence, reproducible calculations and separate financial approval.
- `aws-site-to-site-vpn`: IPsec hybrid networking, two tunnels, scoped changes and rollback; not WireGuard or Client VPN.
- `aws-well-architected-review`: scoped evidence-led reviews, explicit incomplete/offline coverage and no certification claim.

Two additional skills use complete upstream source at `b2a94d85e6673f54511df0b5d78b82b0e716d73b`:

- `aws-observability`: classic CloudWatch and Omni dashboards, metrics, logs, alarms, tracing and diagnostics.
- `setting-up-cloudwatch-alarm-notifications`: SNS topics, encryption, policies, subscriptions and delivery checks.

Their complete onboarding dependency, `setting-up-cloudwatch-observability`, is bundled as supporting material, not another registered specialist. All 120 selected tracked files, including scripts, assets, references and LICENSE/NOTICE, are preserved unchanged. See [CloudWatch prerequisites, corrections and update procedure](CLOUDWATCH.md) and [snapshot hashes](CLOUDWATCH-UPSTREAM.json).

## Installation

Already included in the single root package:

```text
pi install /absolute/path/to/devops-skills
```

Do not register this component separately alongside the root. It contains no startup extension, hook, MCP configuration, proxy or AWS agent runtime. Optional CloudWatch Python helpers are preserved as inert source and never run on load. IAM Autopilot, Security/DevOps Agent workflows, startup advisor and other upstream plugins are not included.

## Dependencies and limits

**Reading instructions requires no new external dependency.** Real AWS operations require approved tools (for example an existing AWS CLI/SDK), temporary credentials, account/region scope and an explicit cost/data budget. MCP is optional and never installed/configured automatically. Cost Explorer/Athena queries, VPNs, logging and commitments can incur charges; read-only IAM is not a spending cap. Workload changes, purchases, resource deletion and disruptive tests need separate approval.

Calculation tools are only needed when calculating data; use an available calculator or reviewed local snippet. No Python, uv, proxy or AWS CLI is added to the root dependencies. The skill documents are portable; the CLI examples still require OS-specific quoting and current-version verification. No AWS or three-OS operational pilot was performed for this integration.

Sources and SHA-256 records: [UPSTREAM.json](UPSTREAM.json). Original [LICENSE](LICENSE) and [NOTICE](NOTICE) are unchanged. The original three adaptations do not vendor source bodies/scripts. The newer CloudWatch snapshot does preserve complete source bodies/scripts and records separate provenance; its local entrypoints explicitly identify safety additions. [SHA256SUMS](SHA256SUMS) records the distributed component's integrity. Inclusion is not AWS endorsement or production certification.

The separate ECC `homelab-wireguard-vpn` skill covers remote-device VPN planning and is included through the engineering catalogue, not this component.
