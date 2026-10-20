---
name: security-audit
description: "Use for source-first security questions, focused reviews, CI/CD and release trust, cloud deployment boundaries, and vulnerability triage. Guidance by default; full audits require an explicit request, scope and budget. No automatic target execution or subagents."
license: MIT
---

# Security Audit — evidence before severity

**Adapted for DevOps Skills from Cloudflare security-audit-skill.** Short Pi entrypoint, progressive references and read-only prompts; upstream workflow/validators preserved unchanged. See [provenance](../../UPSTREAM.json) and [MIT licence](../../LICENSE).

## Mode selection

Loading this skill authorises neither an audit nor file creation. Default to focused guidance: inspect only the relevant source/instructions, answer the question and do not launch agent waves or create reports.

Only an explicit codebase audit/pen-test/full-review request or requested report artifacts selects full audit mode. If ambiguous, ask one focused question. Agree target, scope, source ref, profile, output and invocation budget before delegation. Do not turn a routine DevOps question into an expensive full audit.

## Pick the minimum guidance

- Focused question: [focused review](../../references/focused-review.md).
- Explicit full audit: [full audit procedure](../../references/full-audit.md), then the complete upstream entrypoint it links.
- CI, dependencies, signing, releases and updates: [supply chain](../../upstream/security-audit/SUPPLY-CHAIN-AND-RELEASE.md).
- IAM, Kubernetes, containers, ingress and secrets: [cloud/deployment](../../upstream/security-audit/CLOUD-AND-DEPLOYMENT.md).
- Quotas, worker/resource exhaustion and recovery: [availability](../../upstream/security-audit/RESOURCE-EXHAUSTION-AND-AVAILABILITY.md).
- Native C/C++, FFI and loaders: [memory safety](../../upstream/security-audit/MEMORY-SAFETY-AND-BINARY.md).
- AI, MCP, tools and memory boundaries: [AI/LLM](../../upstream/security-audit/AI-AND-LLM.md).

Other domains: [web/auth](../../upstream/security-audit/WEB-PROTOCOL-AND-AUTH.md), [client-side](../../upstream/security-audit/CLIENT-SIDE.md), [data lifecycle](../../upstream/security-audit/DATA-ISOLATION-AND-LIFECYCLE.md), [RPC/messaging](../../upstream/security-audit/PROTOCOLS-RPC-AND-MESSAGING.md), [desktop/local IPC](../../upstream/security-audit/DESKTOP-MOBILE-AND-LOCAL-IPC.md). Load only relevant sections, not every companion.

## Evidence contract

Name the lower-trust actor/input, intended control, crossed boundary, affected resource and concrete result. Read current source and relevant controls; do not infer deployment facts or live reachability.

Use `confirmed` only for an established boundary failure with the source trace and bounded observed result required upstream. Use `needs_validation` only for a source-grounded hypothesis with an exact unresolved fact and safe plan; give it no severity. Use `rejected` for a disproved candidate. Separate hardening advice from vulnerabilities; never label an unreviewed area secure.

## Execution and delegation boundaries

Source inspection is read-only. No network probing, production identities, publishing, paid API experiments, dependency installs or source modifications.

Target-controlled builds, tests, fixtures, browsers and fuzzers require the full upstream OS-enforced sandbox: no external network, empty allowlisted environment, read-only target/toolchain, scratch-only writes and CPU/memory/process/file/disk/time limits. If any control is unavailable, do not execute; disclose the exact blocker. A temporary copy or a separate agent is not a sandbox.

This integration supplies no sandbox or artifact-promotion implementation. Do not retain target-generated artifacts without the complete upstream descriptor/no-follow promotion controls.

Role prompts run in the current session and do not enforce tools or independence. For full audits, use genuinely separate host-supported workers with explicit scopes and minimal tools; discover the actual delegation API instead of assuming upstream `research`/`general` names exist. A hunter cannot verify its own claim; two prompts in one session are not independent verification. Without independent workers, remain in guidance or disclose an incomplete audit. Never widen `ops_agent` beyond its existing network roles.

## Full-audit outputs

The parent alone owns shared metadata, coverage ledger, findings and reports. Use the unchanged upstream schema and both validators; a valid JSON record does not prove its claim. Preserve profile/budget gates and all six phases. Record gaps/incomplete status instead of silently omitting checks or exhausting an agreed budget.
