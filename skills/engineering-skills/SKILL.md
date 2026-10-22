---
name: engineering-skills
description: "Catalogue of 113 engineering skills and sub-skills. DevOps, AWS/Azure/GCP, Microsoft 365, security, incident response, architecture, development, QA, AI/data, Playwright and agent memory. Load only the specialist SKILL.md needed for the task."
---

# Engineering Skills — Catalogue

This catalogue lists **113 skills/sub-skills** in the unified package, excluding this index. All specialists below are included by the main package manifest. All listed paths are relative to this catalogue; modular source/reference directories do not require separate installation. Upstream snapshots and test fixtures are not additional operational skills.

Copyright and licence notices are preserved in the repository's `LICENSE`, `THIRD_PARTY_NOTICES.md`, and nested licence files. Inclusion is not a security certification.

## Operating rules

1. Select the relevant specialist below and read its complete `SKILL.md`; do not bulk-load the bundle.
2. Resolve a specialist's relative references against its own directory, not this catalogue's directory.
3. Follow the specialist's referenced documentation as needed. Consult the selected specialist's supporting references for workflows.
4. Inspect scripts and requirements before execution. Do not assume all tools are stdlib-only or dependency-free; check each specialist.
5. Start operational diagnosis with read-only checks. Obtain explicit approval for production changes, disruptive commands or security testing; define scope and rollback.
6. Never expose credentials, tokens or personal data in output. Memory skills must not persist secrets.
7. Loading instructions does not establish access, authorisation or successful execution. Report verified results separately from recommendations.
8. When evaluating external skill packs, start with reusable skills, agents/prompts and workflows: identify value, duplication, adaptation needs and exclusions. Keep the review scoped and token-conscious; do not default to a codebase-wide audit unless requested. Before integrating selected content, check its provenance, licence and relevant safety boundaries. Critical review does not authorise offensive security testing.

## Cloud, DevOps and IT (7)

| Skill | Focus | File |
|---|---|---|
| senior-devops | CI/CD, infrastructure and containers | `senior-devops/SKILL.md` |
| aws-solution-architect | AWS architecture | `aws-solution-architect/SKILL.md` |
| azure-cloud-architect | Azure architecture | `azure-cloud-architect/SKILL.md` |
| gcp-cloud-architect | Google Cloud architecture | `gcp-cloud-architect/SKILL.md` |
| ms365-tenant-manager | Microsoft 365 administration | `ms365-tenant-manager/SKILL.md` |
| google-workspace-cli | Google Workspace CLI workflows | `google-workspace-cli/skills/google-workspace-cli/SKILL.md` |
| incident-commander | Incident coordination | `incident-commander/SKILL.md` |

## Security (8)

| Skill | Focus | File |
|---|---|---|
| senior-secops | Security operations | `senior-secops/SKILL.md` |
| senior-security | Security engineering | `senior-security/SKILL.md` |
| cloud-security | Cloud security | `cloud-security/SKILL.md` |
| ai-security | AI security | `ai-security/SKILL.md` |
| threat-detection | Threat detection | `threat-detection/SKILL.md` |
| incident-response | Security incident response | `incident-response/SKILL.md` |
| security-pen-testing | Authorised penetration testing | `security-pen-testing/SKILL.md` |
| red-team | Authorised adversarial testing | `red-team/SKILL.md` |

## Architecture and development (10)

| Skill | File |
|---|---|
| senior-architect | `senior-architect/SKILL.md` |
| senior-backend | `senior-backend/SKILL.md` |
| senior-frontend | `senior-frontend/SKILL.md` |
| senior-fullstack | `senior-fullstack/SKILL.md` |
| code-reviewer | `code-reviewer/SKILL.md` |
| adversarial-reviewer | `adversarial-reviewer/SKILL.md` |
| named-persona-adversarial-review | `named-persona-adversarial-review/SKILL.md` |
| epic-design | `epic-design/SKILL.md` |
| tech-stack-evaluator | `tech-stack-evaluator/SKILL.md` |
| embedded-iot-mentor | `embedded-iot-mentor/SKILL.md` |

## Quality and testing (13)

| Skill/sub-skill | File |
|---|---|
| senior-qa | `senior-qa/SKILL.md` |
| tdd-guide | `tdd-guide/SKILL.md` |
| a11y-audit | `a11y-audit/skills/a11y-audit/SKILL.md` |
| Playwright: pw | `playwright-pro/skills/pw/SKILL.md` |
| Playwright: pw-init | `playwright-pro/skills/pw-init/SKILL.md` |
| Playwright: pw-review | `playwright-pro/skills/pw-review/SKILL.md` |
| Playwright: generate | `playwright-pro/skills/generate/SKILL.md` |
| Playwright: fix | `playwright-pro/skills/fix/SKILL.md` |
| Playwright: coverage | `playwright-pro/skills/coverage/SKILL.md` |
| Playwright: migrate | `playwright-pro/skills/migrate/SKILL.md` |
| Playwright: report | `playwright-pro/skills/report/SKILL.md` |
| Playwright: browserstack | `playwright-pro/skills/browserstack/SKILL.md` |
| Playwright: testrail | `playwright-pro/skills/testrail/SKILL.md` |

## AI and data (6)

| Skill | File |
|---|---|
| senior-data-scientist | `senior-data-scientist/SKILL.md` |
| senior-data-engineer | `senior-data-engineer/SKILL.md` |
| senior-ml-engineer | `senior-ml-engineer/SKILL.md` |
| senior-prompt-engineer | `senior-prompt-engineer/SKILL.md` |
| senior-computer-vision | `senior-computer-vision/SKILL.md` |
| snowflake-development | `snowflake-development/skills/snowflake-development/SKILL.md` |

## Integrations (2)

| Skill | File |
|---|---|
| stripe-integration-expert | `stripe-integration-expert/SKILL.md` |
| email-template-builder | `email-template-builder/SKILL.md` |

## Agent memory and improvement (6)

| Skill/sub-skill | File |
|---|---|
| self-improving-agent | `self-improving-agent/skills/self-improving-agent/SKILL.md` |
| remember | `self-improving-agent/skills/remember/SKILL.md` |
| extract | `self-improving-agent/skills/extract/SKILL.md` |
| promote | `self-improving-agent/skills/promote/SKILL.md` |
| memory-review | `self-improving-agent/skills/memory-review/SKILL.md` |
| memory-status | `self-improving-agent/skills/memory-status/SKILL.md` |

## Advanced engineering (37)

These specialists are installed directly in this catalogue's directory. All paths below identify their operational entrypoints, not test fixtures.

| Skill | File |
|---|---|
| agent-designer | `agent-designer/SKILL.md` |
| agent-workflow-designer | `agent-workflow-designer/SKILL.md` |
| api-design-reviewer | `api-design-reviewer/SKILL.md` |
| api-test-suite-builder | `api-test-suite-builder/SKILL.md` |
| browser-automation | `browser-automation/SKILL.md` |
| changelog-generator | `changelog-generator/SKILL.md` |
| chaos-engineering | `chaos-engineering/SKILL.md` |
| ci-cd-pipeline-builder | `ci-cd-pipeline-builder/SKILL.md` |
| codebase-onboarding | `codebase-onboarding/SKILL.md` |
| database-designer | `database-designer/SKILL.md` |
| database-schema-designer | `database-schema-designer/SKILL.md` |
| dependency-auditor | `dependency-auditor/SKILL.md` |
| env-secrets-manager | `env-secrets-manager/SKILL.md` |
| feature-flags-architect | `feature-flags-architect/SKILL.md` |
| focused-fix | `focused-fix/SKILL.md` |
| full-page-screenshot | `full-page-screenshot/SKILL.md` |
| git-worktree-manager | `git-worktree-manager/SKILL.md` |
| interview-system-designer | `interview-system-designer/SKILL.md` |
| kubernetes-operator | `kubernetes-operator/SKILL.md` |
| mcp-server-builder | `mcp-server-builder/SKILL.md` |
| migration-architect | `migration-architect/SKILL.md` |
| monorepo-navigator | `monorepo-navigator/SKILL.md` |
| observability-designer | `observability-designer/SKILL.md` |
| performance-profiler | `performance-profiler/SKILL.md` |
| pr-review-expert | `pr-review-expert/SKILL.md` |
| rag-architect | `rag-architect/SKILL.md` |
| runbook-generator | `runbook-generator/SKILL.md` |
| secrets-vault-manager | `secrets-vault-manager/SKILL.md` |
| self-eval | `self-eval/SKILL.md` |
| ship-gate | `ship-gate/SKILL.md` |
| skill-security-auditor | `skill-security-auditor/SKILL.md` |
| skill-tester | `skill-tester/SKILL.md` |
| slo-architect | `slo-architect/SKILL.md` |
| spec-driven-workflow | `spec-driven-workflow/SKILL.md` |
| sql-database-assistant | `sql-database-assistant/SKILL.md` |
| tc-tracker | `tc-tracker/SKILL.md` |
| tech-debt-tracker | `tech-debt-tracker/SKILL.md` |

## Agent application development (1)

| Skill | Focus | File |
|---|---|---|
| deep-agents-core | Building LangChain Deep Agents applications; does not add runtime capabilities to Pi | `deep-agents-core/SKILL.md` |

Optional framework dependencies and example limitations are documented in `../../docs/DEPENDENCIES.md`. Load this specialist only when developing Deep Agents applications.

## Network operations and Kubernetes — ECC (8)

| Skill | File |
|---|---|
| network-interface-health | `network-interface-health/SKILL.md` |
| network-config-validation | `network-config-validation/SKILL.md` |
| network-bgp-diagnostics | `network-bgp-diagnostics/SKILL.md` |
| netmiko-ssh-automation | `netmiko-ssh-automation/SKILL.md` |
| cisco-ios-patterns | `cisco-ios-patterns/SKILL.md` |
| homelab-network-readiness | `homelab-network-readiness/SKILL.md` |
| homelab-network-setup | `homelab-network-setup/SKILL.md` |
| kubernetes-patterns | `kubernetes-patterns/SKILL.md` |

The three adapted ECC network role prompts are indexed in `../../agents/README.md`. They run in the current Pi session, not isolated subagents. Network guidance is vendor/version-dependent; host syntax and permissions must be verified.

## Reliability and error handling (1)

| Skill | Focus | File |
|---|---|---|
| dsh-error-handling | Structured failures, recovery ownership, safe retries and verified outcomes; instructions only, no DeepSeek runtime | `dsh-error-handling/SKILL.md` |

## Engineering, task context and web quality — Addy Osmani (10)

These MIT skills are part of the main package. [Engineering capabilities and limits](../../integrations/addy-engineering/README.md) and [web/SEO capabilities and limits](../../integrations/web-quality/README.md) distinguish available instructions from executable checks and measured outcomes.

| Skill | Purpose | File |
|---|---|---|
| constraint-driven-development | Agreed quality rules and measured/enforced gates, no automatic tools | [SKILL.md](../../integrations/addy-engineering/skills/constraint-driven-development/SKILL.md) |
| context-engineering | Selective context and existing task handoffs | [SKILL.md](../../integrations/addy-engineering/skills/context-engineering/SKILL.md) |
| source-driven-development | Version-specific official documentation and bounded verification | [SKILL.md](../../integrations/addy-engineering/skills/source-driven-development/SKILL.md) |
| code-simplification | Scoped contract-preserving refactoring | [SKILL.md](../../integrations/addy-engineering/skills/code-simplification/SKILL.md) |
| web-quality-audit | Selected web categories with explicit evidence and verification gaps | [SKILL.md](../../integrations/web-quality/skills/web-quality-audit/SKILL.md) |
| web-performance | Field/lab web loading and runtime diagnosis | [SKILL.md](../../integrations/web-quality/skills/web-performance/SKILL.md) |
| core-web-vitals | Measured LCP, INP and CLS | [SKILL.md](../../integrations/web-quality/skills/core-web-vitals/SKILL.md) |
| web-accessibility | Rendered/manual web accessibility, complements a11y-audit | [SKILL.md](../../integrations/web-quality/skills/web-accessibility/SKILL.md) |
| web-seo | Technical/on-page/product/localised SEO, no ranking guarantees | [SKILL.md](../../integrations/web-quality/skills/web-seo/SKILL.md) |
| web-best-practices | Browser compatibility/hygiene, not a full security audit | [SKILL.md](../../integrations/web-quality/skills/web-best-practices/SKILL.md) |

The main package also provides the same-session prompts test-engineer and web-performance-auditor, not an autonomous subagent runtime. ADR/doubt material is reference-only. Do not copy hooks, install measurement tools, collect analytics, invoke external models or auto-commit from upstream examples. Web completeness requires actual tools/manual checks; SEO is not a complete marketing/advertising platform.

## Source-first security audit — Cloudflare (1)

| Skill | Purpose | File |
|---|---|---|
| security-audit | Evidence-led focused reviews and explicitly requested full audits; independent validation and coverage | [SKILL.md](../../integrations/security-audit/skills/security-audit/SKILL.md) |

This Cloudflare-derived MIT skill and its three same-session role prompts are included in the main package. See [roles and limits](../../integrations/security-audit/README.md). The prompts are not a subagent runtime. Guidance is the default; full audits need scope/profile/budget and real independent workers. Target execution requires OS-enforced isolation that the pack does not supply. Prefer supply-chain/release and cloud/deployment companions for DevOps; load other domains only when relevant.

## Project context — Graphify (1)

| Skill | Purpose | File |
|---|---|---|
| graphify | Explicit project maps, bounded queries and saved findings; no automatic session capture | [SKILL.md](../../integrations/graphify/skills/graphify/SKILL.md) |

This adapted Apache-2.0 skill is included in the main package; see [external tool requirements and limits](../../integrations/graphify/README.md). Installing its external CLI is separate from making the skill available. It adds no agents, subagents, guard or hooks. Do not install the external Graphify runtime or send documents to a model automatically. For task continuity, reuse the existing planning/TC handoff rather than duplicating memory.

## Known coverage gaps for hybrid IT

Focused network guidance is now included, primarily IOS/IOS-XE and small-lab planning; it does not establish comprehensive multi-vendor coverage. Dedicated Windows Server/AD/GPO, Linux administration, VMware/Proxmox, Xen Orchestra/XCP-ng, storage, enterprise backup/disaster recovery, endpoint management and ITIL/ITSM skills remain gaps. Optional UniFi source is separate and not production-approved.

For these areas, use vendor documentation and approved local runbooks. Add specialist skills only after reviewing their provenance, scope, requirements and operational safety. Company-specific versions, network topology, policies and tools must be supplied separately; never embed secrets.

## Maintenance

1. Review proposed additions and updates before integrating them.
2. Back up local files and review incoming changes before replacing them. Preserve this local catalogue and any company-specific material.
3. Copy approved specialist directories with their scripts, references and assets; do not execute installation hooks automatically.
4. Rebuild the inventory from local `SKILL.md` files, excluding this index. Verify every listed path exists and every installed specialist is listed.
5. Update this catalogue and review coverage gaps after changes. Updates are not automatic.

## Visual communication and model availability

| Skill | Use | Path |
|---|---|---|
| archify | On-demand native interactive diagrams with pinned external runtime; generic symbols by default, no automatic browser/network/update | [SKILL.md](../../integrations/archify/skills/archify/SKILL.md) |
| model-resilience | Explicit bounded fallback between existing Pi API/OAuth providers and an approved OmniRoute gateway; no automatic install/start/login changes | [SKILL.md](../../integrations/omniroute/skills/model-resilience/SKILL.md) |
