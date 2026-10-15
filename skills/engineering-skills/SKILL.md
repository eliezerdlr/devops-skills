---
name: engineering-skills
description: "Catalogue of 90 engineering skills and sub-skills. DevOps, AWS/Azure/GCP, Microsoft 365, security, incident response, architecture, development, QA, AI/data, Playwright and agent memory. Load only the specialist SKILL.md needed for the task."
---

# Engineering Skills — Catalogue

This catalogue lists **90 skills/sub-skills** included in this repository, excluding this index. All listed paths are relative to the directory containing this file. Test fixtures are not operational skills.

Copyright and licence notices are preserved in the repository's `LICENSE`, `THIRD_PARTY_NOTICES.md`, and nested licence files. Inclusion is not a security certification.

## Operating rules

1. Select the relevant specialist below and read its complete `SKILL.md`; do not bulk-load the bundle.
2. Resolve a specialist's relative references against its own directory, not this catalogue's directory.
3. Follow the specialist's referenced documentation as needed. Consult the selected specialist's supporting references for workflows.
4. Inspect scripts and requirements before execution. Do not assume all tools are stdlib-only or dependency-free; check each specialist.
5. Start operational diagnosis with read-only checks. Obtain explicit approval for production changes, disruptive commands or security testing; define scope and rollback.
6. Never expose credentials, tokens or personal data in output. Memory skills must not persist secrets.
7. Loading instructions does not establish access, authorisation or successful execution. Report verified results separately from recommendations.

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

## Known coverage gaps for hybrid IT

There are no dedicated installed skills for enterprise networking/firewalls, Windows Server/AD/GPO, Linux administration, VMware/Proxmox, storage, backup/disaster recovery, endpoint management or ITIL/ITSM. Existing skills may partially overlap; do not claim dedicated coverage.

For these areas, use vendor documentation and approved local runbooks. Add specialist skills only after reviewing their provenance, scope, requirements and operational safety. Company-specific versions, network topology, policies and tools must be supplied separately; never embed secrets.

## Maintenance

1. Review proposed additions and updates before integrating them.
2. Back up local files and review incoming changes before replacing them. Preserve this local catalogue and any company-specific material.
3. Copy approved specialist directories with their scripts, references and assets; do not execute installation hooks automatically.
4. Rebuild the inventory from local `SKILL.md` files, excluding this index. Verify every listed path exists and every installed specialist is listed.
5. Update this catalogue and review coverage gaps after changes. Updates are not automatic.
