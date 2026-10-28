# WireGuard deployment, revocation and rollback

Local safety adaptation of ECC Homelab WireGuard VPN. MIT, Copyright (c) 2026 Affaan Mustafa; see ../LICENSE and ../UPSTREAM.json. No installation or change is authorized by reading this checklist.

## Change record before deployment

Record target OS/firmware, privileges, interfaces, subnet ownership, LAN return paths, approved peer/device and destination/port list, DNS, IPv6 policy and endpoint reachability. Confirm CGNAT/double NAT limitations, no overlapping CIDRs, recovery console and a maintenance window. Preserve existing firewall, route, forwarding and service state in a restricted backup.

Write down the exact proposed changes and how each will be reverted, including upstream port forwarding and client DNS. Obtain explicit approval. Do not disable firewalls, flush tables, replace existing wg0 or change a default route speculatively.

## Protected config lifecycle

1. Generate one keypair per device locally; never ask the model to hold or transfer private keys.
2. Create owner-restricted directories/files at creation time (Unix 0700/0600 or equivalent Windows ACLs).
3. Refuse symlinks and existing-file overwrite by default. Replacement needs a private backup and explicit approval.
4. Review a redacted configuration: unique peer host routes, narrow destinations, no unapproved hooks, no input containing newline injection.
5. Apply with the target platform's supported method. Recheck saved and live state without printing secret-bearing config.
6. Validate before enabling boot/login persistence. Document who can recover the keys and backup; no secrets in the change report.

## Validation matrix

| Check | Pass evidence |
|---|---|
| Remote reachability | Fresh approved traffic establishes a handshake from the actual remote network |
| Authorized service | Required host/port works, including return routing |
| Gateway access | Only deliberately allowed gateway services are reachable |
| Isolation | Approved negative checks show other VLANs, services and peers remain denied |
| Split tunnel | Only intended routes go through VPN; required DNS/tunnel destinations included |
| Full tunnel | Intended IPv4 and IPv6 egress behavior verified; no unsupported claim about all traffic |
| DNS | Expected resolver reachable, local/public names resolve, configured privacy/fallback behavior checked |
| Failure policy | Separately approved tunnel-loss test verifies intended fail-closed or disclosed direct-egress behavior |
| Persistence | Approved service/client restart test preserves intended rules/routes without duplicates |
| Revocation | Lost/test peer fails access after revocation; other approved peers still work |

Negative probes and disruptive failure tests must be explicitly scoped. A passing handshake, ping or IP check alone does not establish DNS privacy, kill-switch correctness, segmentation or application access.

## Revocation

Identify the public-key fingerprint/device mapping without exporting private keys. Remove or disable only that peer with an approved platform operation, update persisted config through a protected path, then verify it cannot re-establish intended access. Check stale NAT/connection state according to platform behavior before declaring immediate revocation complete. Keep a redacted record. Do not promise session termination from a file edit not applied to the live interface.

## Rollback

On route leak, management loss, unexpected access or DNS failure, stop further changes. Use the alternate console to restore approved previous routes, DNS, forwarding, firewall and service state. Remove only rules/resources introduced by this change, not shared infrastructure. Do not revert an intentional security revocation by blindly restoring a backup containing the revoked peer. Validate management and application access after recovery.

A reboot/restart, failover or recovery drill is a separate approved operation; do not perform it simply to complete documentation. Record untested scenarios honestly.
