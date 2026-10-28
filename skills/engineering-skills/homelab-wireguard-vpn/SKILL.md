---
name: homelab-wireguard-vpn
description: "Plan and diagnose WireGuard remote access to a home or small-lab network: peer keys, split/full tunnel, narrow firewall/NAT, IPv6, revocation, validation and rollback. Read-only first; no automatic installation or network changes."
metadata:
  origin: community
---

# Homelab WireGuard VPN

Adapted from ECC, MIT, Copyright (c) 2026 Affaan Mustafa. Local modifications: approval/readiness gates, private non-overwriting configuration handling, narrow firewall policy, explicit IPv6/CGNAT behavior, revocation and rollback; removed Python generation and DDNS automation. See [LICENSE](LICENSE) and [UPSTREAM.json](UPSTREAM.json).

## Scope and prerequisites

Instructions only: loading this skill installs no VPN, agent, daemon, firewall rule or package. Actual deployment requires WireGuard or a supported router feature on the chosen endpoint and client, plus platform-specific privileges. Do not install tools or change services automatically. Linux, pfSense/OPNsense, macOS and Windows have different configuration, firewall, DNS and service behavior; no universal command sequence is supplied or platform homologation implied.

Use for individual device access to a homelab or small network. Not a replacement for enterprise identity/MFA management, NetBird/Tailscale, AWS IPsec site-to-site or HA design. WireGuard keys authenticate devices; they do not by themselves establish a user's identity or MFA.

Read `homelab-network-readiness` before deployment planning and [deployment checklist](references/deployment-checklist.md) before proposing commands.

## First response: inspect and plan

Confirm OS/router vendor and version, endpoint location, WAN/public address behavior, upstream routers, CGNAT/double NAT, actual interfaces, existing firewall backend, IPv4/IPv6 subnets, DNS, required services and management access. Check conflicts between home, remote and tunnel subnets; common home LAN ranges can overlap with travel networks.

DDNS tracks an address; it does not bypass CGNAT, create port forwarding or make a private endpoint reachable. For inbound VPN, confirm a supported reachable endpoint and narrowly approved UDP forwarding/firewall rules. Do not expose admin UIs, SSH, NAS or DNS directly to the internet as a workaround.

Record current config/route/firewall/service state, private backup location, change window, console/out-of-band access, owner and rollback. A remote-only operator must not replace their sole management route without a recovery path. Ask for explicit approval before installing, forwarding ports, altering forwarding/NAT/DNS or starting/restarting a VPN.

## Tunnel and peer design

- Allocate a non-conflicting tunnel subnet and a distinct keypair/IP for each device. Prefer generating private keys on the client through a trusted local workflow. Never request private keys, PSKs, QR codes or full client configs in chat.
- Server-side peer AllowedIPs normally map each client to its unique tunnel host route (`/32` or `/128`); add routed networks only for an explicitly designed site-to-site topology. Reject overlapping peer ownership.
- Client-side AllowedIPs selects tunnel destinations; it is not a server firewall ACL. Enforce approved networks, protocols and ports on the VPN gateway, including traffic to the gateway itself. Keep VPN access no broader than intended trusted access.
- Split tunnel routes only requested home/services subnets, plus necessary tunnel/DNS destinations. Full tunnel requires an explicit policy for both IPv4 and IPv6, DNS, egress, failure handling and local-LAN access. Do not advertise `::/0` as working full tunnel on an IPv4-only server.
- If IPv6 will not be carried, define and verify intentional blocking/disablement on the relevant client path or explicitly disclose direct IPv6 egress; do not claim an all-traffic tunnel. Platform-specific kill-switch behavior must be separately configured and tested.
- PersistentKeepalive (often 25 seconds) is useful when NAT mappings must stay available; it is not universally required for mobile devices. Consider battery and traffic effects.

## Secret-safe configuration handling

Create the configuration directory private from the start (0700 on suitable Unix systems) and files 0600 at creation, or equivalent restrictive Windows ACLs. Confirm owner and path; reject symlinks and unexpected existing files. Use exclusive creation or a protected temporary file plus an approved atomic replacement, never blindly overwrite a deployment.

Do not write secrets through `tee` with terminal echo, paste them into tool arguments, print them for inspection or apply chmod only after a world-readable write. Keep key material outside version control, logs, screenshots and model context. A .gitignore is not access control. For a requested replacement, obtain approval and preserve a private recoverable backup. Import QR codes only directly into the authorized client; they are credentials.

This adaptation intentionally provides no Python config generator, automatic DDNS updater or generic privileged setup script. Do not reconstruct these from untrusted strings or interpolate user input into wg-quick hooks. If automation is separately requested, validate addresses/keys/endpoints, reject CR/LF and shell directives, inspect scripts and use checked bounded subprocesses.

## Routing and firewall

Select the exact platform firewall manager (nftables, iptables, UFW, router UI, etc.) before designing rules. Do not mix backends or assume `eth0` is the LAN/WAN interface. Specify ingress, egress, source VPN subnet, destination service subnet, protocol/ports and established-return policy. Separately cover INPUT to gateway services and FORWARD through the gateway; do not change a default policy or add broad ACCEPT rules as a shortcut.

Choose a return route from the LAN to the VPN subnet where supported. If NAT is required, scope translation to the VPN source subnet and intended egress/destinations so unrelated forwarded traffic is unaffected. Do not masquerade everything leaving the default interface. Check rule ordering and peer-to-peer isolation. Configure IPv6 independently; IPv4 iptables/NAT does not provide IPv6 policy.

Enable only the required forwarding setting through a reviewed platform-specific change; avoid reapplying all system sysctl settings to change one value. Preserve existing forwarding users and settings for rollback. Make service persistence a separate explicit step after manual validation.

## Read-only diagnosis

With approved local access, status commands such as these may help on supported systems:

```text
wg show
ip route show
ip -6 route show
```

Do not use `wg showconf`, `wg show all dump` or private-key output in chat/log collection. Even public keys, endpoint IPs and status are sensitive inventory; redact as needed. Command availability differs by OS; do not install missing commands automatically.

An old handshake can mean an idle peer, not failure. Correlate latest traffic counters, intended test traffic, routes, firewall and DNS. Validate reachability to an approved service, not just handshake. Never perform an automatic `down && up` restart while diagnosing: it can sever the session and leave the interface down if startup fails.

## Acceptance and recovery

Use the checklist to test authorized access, denied paths, IPv4/IPv6/DNS behavior and intended failure policy. Keep performance claims separate from evidence; tunnel throughput depends on endpoint/ISP/CPU/MTU and is not established by these instructions.

For a lost device, revoke its public-key peer on the gateway and remove its allowed access through the platform's approved apply/persistence method. Verify rejection and saved-state consistency; rotating the server key is not the default way to revoke one client. Server rotation requires a coordinated update of all clients and rollback.

## Official documentation and related skills

- https://www.wireguard.com/quickstart/
- https://www.wireguard.com/netns/
- Use vendor/version documentation for pfSense/OPNsense and client DNS/firewall behavior.
- Related: `homelab-network-readiness`, `homelab-network-setup`, `network-config-validation`, `aws-site-to-site-vpn` (different protocol/use case).
