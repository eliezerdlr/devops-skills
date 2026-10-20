# Third-party notices

## Engineering skills

Source: https://github.com/alirezarezvani/claude-skills
Source directories: `engineering-team/` and `engineering/skills/`.

MIT License — Copyright (c) 2025 Alireza Rezvani.
The full permission notice and disclaimer are preserved in root `LICENSE` and `skills/engineering-skills/LICENSE`.

### Playwright Pro and Self-Improving Agent

MIT License — Copyright (c) 2026 Reza Rezvani.
The full notices are retained at:
- `skills/engineering-skills/playwright-pro/LICENSE`
- `skills/engineering-skills/self-improving-agent/LICENSE`

## ECC — selected skills and adapted network role prompts

Source: https://github.com/affaan-m/ecc

MIT License — Copyright (c) 2026 Affaan Mustafa.
The unmodified source licence is preserved in `licenses/ecc-MIT.txt`, `agents/LICENSE`, and each included ECC skill directory. The root MIT notice includes the original copyright. This does not attribute other authors' content to Affaan Mustafa.

Included unchanged under `skills/engineering-skills/`: `network-interface-health`, `network-config-validation`, `network-bgp-diagnostics`, `netmiko-ssh-automation`, `cisco-ios-patterns`, `homelab-network-readiness`, `homelab-network-setup`, and `kubernetes-patterns`.

Adapted from ECC `agents/`: `agents/network-architect.md`, `agents/network-troubleshooter.md`, and `agents/network-config-reviewer.md`. Local modifications remove Claude model/tool frontmatter, add a Pi argument hint and task substitution, and explain same-session execution and approval boundaries. The original role bodies remain otherwise unchanged. These are prompt templates, not a bundled subagent runtime. ECC installers, hooks, rules and extension code are not included.

## LangChain — Deep Agents Core

Source: https://github.com/langchain-ai/langchain-skills
Source file: `config/skills/deep-agents-core/SKILL.md`.

MIT License — Copyright (c) LangChain, Inc.

Included at `skills/engineering-skills/deep-agents-core/SKILL.md`, unchanged from the reviewed source snapshot. The unmodified source licence is retained in `skills/engineering-skills/deep-agents-core/LICENSE` and `licenses/langchain-MIT.txt`; the root MIT notice includes the original copyright string. Local catalogue and dependency notes are separate additions, not LangChain-authored content. No framework source, model credentials or runtime installation is bundled.

## UniFi Skills — optional original source under review

Source: https://github.com/t3chnaztea/unifi-skills

MIT License — Copyright (c) 2026 t3chnaztea.

The original project is distributed in `integrations/unifi-skills/`, with its original LICENSE and README attribution retained. Its licence is also preserved in `licenses/unifi-MIT.txt`. It is not automatically loaded by the Pi manifest and is not approved for production use.

The helper explicitly credits derivation from `dlewis7444/unifi-claude-skill` under MIT; that attribution is retained unchanged. Verification of the precise original helper copyright/licence remains outstanding; the derivative project's MIT notice is not a claim that upstream attribution requirements have been independently resolved.

## DeepSeek Harness — error-handling skill only

Source: https://github.com/deepseek-ai/deepseek-harness
Source file: `.agents/skills/dsh-error-handling/SKILL.md`.

MIT License — Copyright (c) 2026 DeepSeek.

Included unchanged at `skills/engineering-skills/dsh-error-handling/SKILL.md`. The original licence is retained alongside the skill and in `licenses/deepseek-MIT.txt`; the root notice preserves its copyright. Only this Markdown skill is redistributed, not runtime code, plugins, dependencies, sandboxing or other skills. Bibliographic references in the skill remain references, not bundled third-party works. Inclusion does not imply endorsement, production certification or an independent security audit.

## Planning with Files — optional Pi package

Source: https://github.com/OthmanAdi/planning-with-files, commit `96b79bf1d64f22ab5f68442e0a45704eef06ddfc`, package version 3.24.0.

MIT License — Copyright (c) 2026 Ahmad Adi.

The `.pi/skills/planning-with-files` package is copied unchanged to `integrations/planning-with-files/upstream/`, with the upstream repository LICENSE additionally included. The original license is also preserved in `licenses/planning-with-files-MIT.txt`. Local documentation, source metadata, integrity hashes and targeted tests are outside the snapshot. This optional package is not activated by the main manifest. Inclusion is not an endorsement, independent security assessment or infrastructure authorisation.

## Cloudflare — optional Security Audit skill and prompts

Source: https://github.com/cloudflare/security-audit-skill, commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`.

MIT License — Copyright (c) 2025-2026 Cloudflare, Inc.

The source README, licence and complete `skills/security-audit/` directory are preserved unchanged under `integrations/security-audit/upstream/`. The original licence is also retained at the integration root. The 22 snapshot files are recorded in `SHA256SUMS`; provenance and local changes are in `UPSTREAM.json`.

The local entrypoint, focused/full workflow bridge and three role prompts are adapted for optional Pi loading, guidance-first use, progressive context and explicit independence/execution boundaries. They identify the adaptation and are distributed under MIT with the retained upstream notice. No Cloudflare harness, sandbox, autonomous agent runtime, live-testing authorisation or official affiliation is included. The root manifest does not activate the integration.

## Graphify — optional adapted instructions

Source: https://github.com/Graphify-Labs/graphify, commit `b90b9df7949bd04a15b40a1624af85d0a9cfdf04`, version 0.9.93.

Apache License 2.0 — Copyright 2026 Safi Shamsi and the Graphify contributors.

Selected Pi skill/query/update guidance and the explicit save-result/reflect workflow are adapted in `integrations/graphify/`; each adapted instruction file identifies the modifications. The full upstream `LICENSE`, `NOTICE` and historical `LICENSE-MIT` are preserved there. Source paths and changes are recorded in `UPSTREAM.json`. Earlier MIT portions do not make the current Graphify distribution exclusively MIT.

Local changes remove automatic installation/upgrades, implicit provider dispatch, mandatory graph-first behavior and subagent requirements; add bounded queries, optional local use and existing planning/TC handoff integration. The package contains instructions only: no Graphify Python runtime, guard, agents, hooks or session collector. It is not enabled by the root manifest and is not officially affiliated with Graphify Labs. Runtime dependencies and end-to-end operation remain separately validated requirements.

## Licence scope

The root MIT notice consolidates the original copyright strings; it does not imply joint authorship of every file. Engineering content is attributed above and its original root licence is also preserved in `licenses/engineering-MIT.txt`. Nested licences retain the exact spelling `Reza Rezvani`; no assumption about legal identity with `Alireza Rezvani` is required. Do not replace or remove those notices when reorganising files.

## Local modifications and additions

New independent local contributions are distributed under the MIT terms in the root LICENSE, as authorised by the maintainer. Graphify-derived instructions retain the Apache-2.0 terms indicated in their integration. This does not replace or transfer upstream copyrights.

- The combined engineering index is locally rewritten and adapted for this distribution.
- Repository README and packaging documentation are local additions.
- The sample skill fixture, cache files and external agent configuration directories are excluded from this distribution.
- Local navigation links were corrected in `security-pen-testing/SKILL.md` and `self-improving-agent/skills/self-improving-agent/SKILL.md`.
- An unavailable sibling skill in `named-persona-adversarial-review/SKILL.md` is explicitly labelled not bundled, instead of linking to an absent file.
- Upstream specialists and their supporting files retain their layout and attribution. No ownership transfer or vendor endorsement is claimed.

## External tools

Snyk Agent Scan source and Sage source are not distributed in this repository. Links and usage guidance do not relicense those projects or grant API access.
