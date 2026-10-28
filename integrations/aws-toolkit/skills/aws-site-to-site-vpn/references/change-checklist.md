# AWS VPN change and validation checklist

Adapted from AWS Agent Toolkit VPN creation, device configuration and HA guidance. Apache-2.0; copyright Amazon.com, Inc. or its affiliates. Local additions: explicit authorization, secret-safe evidence, rollback and qualified availability. See integration LICENSE, NOTICE and UPSTREAM.json.

## Before any write

- Account/profile/region and ownership of both sides confirmed; use temporary least-privilege credentials.
- Approved resource list, expected recurring/one-off charges and no implicit IAM/Secrets Manager/logging setup.
- Backups of device config and affected route/firewall state under restricted access, without copying secrets to chat.
- CIDR overlap, ASNs, MTU/MSS, NAT-T, local firewall and asymmetric routing considered for the exact device/version.
- An alternate management path and a maintenance window exist. Establish abort criteria and an operator able to restore local access.
- Inventory pre-existing resources. Never delete a shared TGW, VGW, route, policy or log group as “rollback.”

## Deployment evidence

Check expected AWS objects and associations, both tunnel configurations, negotiated IKE/IPsec compatibility, intended prefixes and return routes. Do not infer correct device configuration from an AWS customer-gateway object: that object describes the endpoint; it does not configure the router.

For BGP, inspect effective advertisements and filtering. Match path-preference choices to the desired maintenance/failover behavior; a Cisco Weight setting is not a portable instruction for every vendor. Static-routing failover has different constraints and must be verified for the actual topology.

## Validation matrix

| Check | Evidence required |
|---|---|
| Authentication/tunnels | Both tunnels establish with expected parameters, no exposed PSKs |
| Routing | Only intended prefixes advertised/propagated and correct return paths |
| Authorized services | Bounded test to approved service/port succeeds |
| Denied access | Approved negative tests show forbidden networks/ports remain inaccessible |
| DNS | Required names resolve over intended resolvers; no accidental public exposure |
| Payload/MTU | Representative traffic works, not only small ICMP packets |
| Failover | Separately approved controlled test, observed recovery time and restoration; not merely two UP indicators |
| Monitoring | Existing metrics/logging checked, alert recipients and data confidentiality reviewed |

CloudWatch metrics, log ingestion, KMS, Secrets Manager and extra connections may add costs. Recommend missing observability separately; do not enable it as an implicit prerequisite of a read-only review.

## Rollback

Stop at pre-agreed error, outage or route-leak thresholds. Restore only the approved previous device/firewall/route state using local access if needed. Remove newly created dedicated resources only after dependencies are checked and deletion is approved. Check traffic and management access after restoration; retain a redacted change record. AWS resource deletion alone does not restore the on-premises configuration.
