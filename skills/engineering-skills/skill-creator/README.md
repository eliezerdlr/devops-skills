# Skill Creator — experience into reusable agent skills

A local Apache-2.0 adaptation of Anthropic's skill-creator, included through the main devops-skills package. No separate installation is required.

## Use

```text
/skill:skill-creator Create a reusable skill from the sanitized workflow and lessons I provide
```

The workflow captures your expertise, actual scope/version, decisions, failure cases and verification. It separates reported experience from observed evidence, checks duplication and turns the result into a short skill with references and acceptance criteria. It does not mine conversations, memory, credentials or client systems automatically.

Before writing, confirm the approved draft/output location and whether an existing skill may be updated. Private notes, fixtures and evaluation outputs stay outside distributed skills. Review diffs and preserve existing material; no automatic install, commit, publishing or global settings changes.

## Creating versus teaching

- `skill-creator`: authors/improves instructions used by an agent; an actual authoring request is required before changes.
- `extract`: identifies a reusable pattern; `skill-tester` checks structure; `skill-security-auditor` reviews risk. These do not prove that a skill improves model behavior.

The teach learning skill is not included. Skill Creator does not train model weights. A new skill can be instruction-only; scripts, agents, libraries and services are not required merely to create a skill.

## Included, and intentionally excluded

Included: entrypoint, knowledge/safety and evaluation/review references, a skill draft template, an inert versioned synthetic evaluation plan, licence and provenance/integrity records.

Excluded: upstream Claude CLI runner, optimization loop, HTTP/browser viewer, process/port cleanup, ZIP/.skill packager, PyYAML dependency and automatic subagent dispatch. The example plan starts with execution unapproved and unknown metric/isolation fields. It is not a model benchmark or a formal schema validator.

## Optional evaluation

Read the evaluation protocol before any run. Actual model/subagent evaluation requires an approved provider, data recipients, isolated environment/tools, output root, budget, bounds and cancellation. No new evaluator runtime is provided, and network OPS workers are not a generic execution backend. A manual review of supplied artifacts is possible without new inference runs.

Candidate/baseline comparisons need equivalent inputs/settings and a verified uncontaminated baseline. Keep output_chars distinct from tokens, missing values null, model failures visible and human acceptance explicit. Small samples, static tests and LLM graders do not establish universal performance or security. There is no measured efficacy claim for this adaptation yet.

## Provenance

Source: https://github.com/anthropics/skills, commit `dbd4588f9e1033efb41dad4bef2f7947c8993d44`, selected `skills/skill-creator/` instructions/roles/schemas. Apache-2.0, Copyright 2026 Anthropic, PBC. Original LICENSE.txt retained verbatim as LICENSE. UPSTREAM.json records selected source hashes and modifications; SHA256SUMS covers local distribution files. Original skill bodies/scripts are not vendored, and this is not an Anthropic-endorsed product or a redistribution of unrelated source-available document skills.
