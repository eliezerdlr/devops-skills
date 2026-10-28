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

### ECC — adapted WireGuard VPN guidance

Additional source: `skills/homelab-wireguard-vpn/SKILL.md`, https://github.com/affaan-m/ECC, commit `90606c8315ee09cafc303515c5f33024db6b9882`. MIT — Copyright (c) 2026 Affaan Mustafa.

The local `skills/engineering-skills/homelab-wireguard-vpn/` retains the original LICENSE and records source/hash and modifications in UPSTREAM.json. Its rewritten instruction entrypoint and local checklist add explicit readiness/approval, private non-overwriting configuration handling, scoped firewall/NAT, IPv6/CGNAT behavior, revocation and rollback. Python generation, DDNS automation and privileged copy-paste install scripts are excluded. The eight earlier ECC skills listed above are unchanged; this ninth skill is explicitly adapted.

## AWS — selected Agent Toolkit instructions

Source: https://github.com/aws/agent-toolkit-for-aws, commit `9ab50636d12510dc351ff02fd7966efa4dba4341`.

Apache License 2.0 — Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Three adapted instruction skills and scoped local references are distributed under `integrations/aws-toolkit/`: billing/cost management, AWS Site-to-Site VPN (renamed from sitetositevpn) and Well-Architected review. Original LICENSE and NOTICE are retained verbatim. UPSTREAM.json records selected source paths/hashes and local modifications; SHA256SUMS records the distributed component. Source skill bodies, scripts, plugins, MCP configuration and hooks are not bundled. Adaptations add bounded guidance-first review, explicit data/cost/change approval, secret-safe handling, rollback and offline/partial modes. They do not install AWS CLI, start agents or confer AWS affiliation, trademark rights or production certification.

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

## Addy Osmani — engineering and web quality selections

Sources:
- https://github.com/addyosmani/agent-skills, commit `aeac41d4d005999432bb7312f7ff06383a91d59d`. MIT License — Copyright (c) 2025 Addy Osmani.
- https://github.com/addyosmani/web-quality-skills, commit `afa8da942115f2961fdbfa80807ea0b232ff6c00`. MIT License — Copyright (c) 2026 Addy Osmani.

Selected source documents are preserved unchanged under `integrations/addy-engineering/upstream/` (20 files) and `integrations/web-quality/upstream/` (17 files). Each integration retains its original LICENSE at both the snapshot and package roots, with provenance/source inventory in UPSTREAM.json and SHA-256 integrity records in SHA256SUMS. Existing inspiration/source links inside the original documents remain intact.

Local MIT adaptations provide four engineering entrypoints, six web entrypoints, two same-session prompts and supporting interpretation/safety guidance. They are labelled as adaptations. Upstream hooks, lifecycle commands, autonomous build loops, global instructions and installers are not included. Reference personas/skills in snapshots are not additional registered resources. The adapted entrypoints and two role prompts are included by the root manifest; no official affiliation or production certification is claimed.

## Cloudflare — Security Audit skill and prompts

Source: https://github.com/cloudflare/security-audit-skill, commit `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8`.

MIT License — Copyright (c) 2025-2026 Cloudflare, Inc.

The source README, licence and complete `skills/security-audit/` directory are preserved unchanged under `integrations/security-audit/upstream/`. The original licence is also retained at the integration root. The 22 snapshot files are recorded in `SHA256SUMS`; provenance and local changes are in `UPSTREAM.json`.

The local entrypoint, focused/full workflow bridge and three role prompts are adapted for unified Pi package loading, guidance-first use, progressive context and explicit independence/execution boundaries. They identify the adaptation and are distributed under MIT with the retained upstream notice. No Cloudflare harness, sandbox, autonomous agent runtime, live-testing authorisation or official affiliation is included. The root manifest includes the adapted skill and three prompts, not the original snapshot skill or an execution harness.

## Graphify — adapted instructions

Source: https://github.com/Graphify-Labs/graphify, commit `b90b9df7949bd04a15b40a1624af85d0a9cfdf04`, version 0.9.93.

Apache License 2.0 — Copyright 2026 Safi Shamsi and the Graphify contributors.

Selected Pi skill/query/update guidance and the explicit save-result/reflect workflow are adapted in `integrations/graphify/`; each adapted instruction file identifies the modifications. The full upstream `LICENSE`, `NOTICE` and historical `LICENSE-MIT` are preserved there. Source paths and changes are recorded in `UPSTREAM.json`. Earlier MIT portions do not make the current Graphify distribution exclusively MIT.

Local changes remove automatic installation/upgrades, implicit provider dispatch, mandatory graph-first behavior and subagent requirements; add bounded queries, optional local use and existing planning/TC handoff integration. The package contains instructions only: no Graphify Python runtime, guard, agents, hooks or session collector. The adapted skill is included by the root manifest; the external Python CLI is not bundled. This is not officially affiliated with Graphify Labs. Runtime dependencies and end-to-end operation remain separately validated requirements.

## Anthropic — adapted skill-creator guidance

Source: https://github.com/anthropics/skills, commit `dbd4588f9e1033efb41dad4bef2f7947c8993d44`, selected `skills/skill-creator/` entrypoint, grader/comparator/analyzer instructions and schema concepts.

Apache License 2.0 — Copyright 2026 Anthropic, PBC.

The original LICENSE.txt is preserved verbatim as `skills/engineering-skills/skill-creator/LICENSE`. UPSTREAM.json records selected source paths/hashes and modifications; SHA256SUMS covers distributed local files. The concise entrypoint, three references and two inert templates are explicitly adapted. No original runner, optimization loop, HTTP/HTML viewer, process cleanup, archive packager, automatic worker or PyYAML dependency is included. Local changes add experience/evidence provenance, authorized source reuse, safe file updates, separate evaluation/data/cost approval, baseline controls and honest metrics. Unrelated source-available document skills, CDN assets and their runtimes are not redistributed. This does not imply Anthropic endorsement, model training or measured behavioral improvement.

## Ponytail — minimal default-full Pi guidance

Source: https://github.com/DietrichGebert/ponytail, version 5.3.2, commit `09c434ab73ca43761c5d8b0c5d341926c2fba710`. MIT License — Copyright (c) 2026 DietrichGebert.

Original licence retained verbatim at `integrations/ponytail/LICENSE`; selected source hashes/modifications in UPSTREAM.json. The local extension under `extensions/ponytail/` and fixed policy adapt the reuse/minimal-complete-change principles with explicit safety, approval, contract and SLA limits. No upstream hooks, band/board, historical-session importer, webhook, global configuration, statusline collector or benchmark runner is bundled. Full/off mode only uses native Pi branch metadata after an explicit command. The root registers the minimal extension full by default, not six upstream skills. Published source benchmarks are not measured savings for this package.

## Licence scope

The root MIT notice consolidates the original copyright strings; it does not imply joint authorship of every file. Engineering content is attributed above and its original root licence is also preserved in `licenses/engineering-MIT.txt`. Nested licences retain the exact spelling `Reza Rezvani`; no assumption about legal identity with `Alireza Rezvani` is required. Do not replace or remove those notices when reorganising files.

## Local modifications and additions

New independent local contributions are distributed under the MIT terms in the root LICENSE, as authorised by the maintainer. Graphify-derived, AWS Toolkit-derived and Anthropic skill-creator-derived instructions retain the Apache-2.0 terms indicated in their respective directories. This does not replace or transfer upstream copyrights.

- The combined engineering index is locally rewritten and adapted for this distribution.
- Repository README and packaging documentation are local additions.
- The sample skill fixture, cache files and external agent configuration directories are excluded from this distribution.
- Local navigation links were corrected in `security-pen-testing/SKILL.md` and `self-improving-agent/skills/self-improving-agent/SKILL.md`.
- An unavailable sibling skill in `named-persona-adversarial-review/SKILL.md` is explicitly labelled not bundled, instead of linking to an absent file.
- Upstream specialists and their supporting files retain their layout and attribution. No ownership transfer or vendor endorsement is claimed.

## External tools

Snyk Agent Scan source and Sage source are not distributed in this repository. Links and usage guidance do not relicense those projects or grant API access.

## OmniRoute integration (external runtime)

Integration references OmniRoute 3.8.53, MIT, commit bdcd6c0088f7a68bb0d18b258fcdc1d6cd44c9ce, https://github.com/cheaper-inference/OmniRoute. The MIT text is preserved in integrations/omniroute/LICENSE; provenance in UPSTREAM.json. Gateway code, accounts and credentials are not vendored. The Pi resilience transport is locally authored; source review/runtime tests do not verify the external service.

## Archify integration (external runtime)

Adapted from Archify 3.2.0, commit 25cf37080fc8b1dbe758a4efc3935b55f3327083. Preserve Copyright (c) 2026 tt-a1i and Copyright (c) 2025 Cocoon and their MIT notices in integrations/archify/LICENSE and NOTICE, plus its THIRD_PARTY_NOTICES.md. Runtime assets/fonts/logos are not copied into this package. MIT does not supersede third-party font/icon/logo licences or trademarks; the default business/marketing profile refuses third-party branding and uses generic symbols. See UPSTREAM.json and runtime-lock.json for provenance/pinning.
