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

## ECC — planned integration, not yet bundled

Source: https://github.com/affaan-m/ecc

MIT License — Copyright (c) 2026 Affaan Mustafa.
The unmodified source licence is preserved in `licenses/ecc-MIT.txt`. Its copyright notice is included in the root MIT notice in preparation for the combined distribution; ECC skills and agents have not yet been copied. Update this section with the exact included paths when integration is performed. The ECC notice does not attribute the existing engineering skills to Affaan Mustafa.

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

## Licence scope

The root MIT notice consolidates the original copyright strings; it does not imply joint authorship of every file. Engineering content is attributed above and its original root licence is also preserved in `licenses/engineering-MIT.txt`. Nested licences retain the exact spelling `Reza Rezvani`; no assumption about legal identity with `Alireza Rezvani` is required. Do not replace or remove those notices when reorganising files.

## Local modifications and additions

New local contributions are distributed under the MIT terms in the root LICENSE, as authorised by the maintainer. This does not replace or transfer upstream copyrights.

- The combined engineering index is locally rewritten and adapted for this distribution.
- Repository README and packaging documentation are local additions.
- The sample skill fixture, cache files and external agent configuration directories are excluded from this distribution.
- Local navigation links were corrected in `security-pen-testing/SKILL.md` and `self-improving-agent/skills/self-improving-agent/SKILL.md`.
- An unavailable sibling skill in `named-persona-adversarial-review/SKILL.md` is explicitly labelled not bundled, instead of linking to an absent file.
- Upstream specialists and their supporting files retain their layout and attribution. No ownership transfer or vendor endorsement is claimed.

## External tools

Snyk Agent Scan source and Sage source are not distributed in this repository. Links and usage guidance do not relicense those projects or grant API access.
