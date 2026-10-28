---
name: skill-creator
description: "Create or refine reusable agent skills from user-supplied expertise, approved workflows and lessons learned. Define scope, triggers, safety and acceptance criteria; design optional evidence-led baseline evaluations. Not automatic memory capture, model training or infrastructure execution."
license: Apache-2.0
---

# Skill Creator

Adapted from Anthropic `skills/skill-creator`, Apache-2.0, Copyright 2026 Anthropic, PBC. Local changes: experience-led authorship, explicit write/data/evaluation approval, host-neutral bounded evaluation and no bundled runner/viewer/packager. See [LICENSE](LICENSE), [UPSTREAM.json](UPSTREAM.json) and [scope and evidence](references/knowledge-and-safety.md).

## Purpose and boundaries

Turn knowledge the user supplies or explicitly authorizes into a concise reusable skill. Use this workflow when asked to create, adapt or improve a skill, not merely because an operational conversation produced a useful insight. Do not collect memory or histories automatically. Analysing a skill does not authorize changing it.

Loading these instructions adds no dependencies, extension, hook, background process or model-training capability. Invoke explicitly with `/skill:skill-creator TASK` or use it for an actual authoring request. This skill authors instructions for an agent, not multi-session lessons for a learner. `extract` can identify a recurring pattern; `skill-tester` checks structure; `skill-security-auditor` reviews risk. Keep these roles separate rather than inventing another global router or assuming their helpers are safe to execute.

Read [knowledge-and-safety.md](references/knowledge-and-safety.md) before reading private sources or writing files. Read [evaluation protocol](references/evaluation.md) only when designing/running evaluations, and [review roles](references/review-roles.md) when grading or comparing outputs.

## 1. Capture the user's expertise and intent

Use what the user has already supplied. Ask only for missing decisions:

- What recurring problem should the skill solve, and for whom?
- Which user phrases should trigger it, and which near-misses should not?
- What inputs, outputs, target versions/tools and acceptance criteria apply?
- Which steps have the user actually performed, which are reported experience, and which remain proposed or unverified?
- What data can be read, generalized and redistributed? What must remain private?

For a request such as “create a skill from the NetBird configuration knowledge I have been applying”, ask for sanitized workflow steps or specifically authorized excerpts. Do not scan personal directories, other chats, credentials, cloud accounts, production systems or memory stores to reconstruct experience. Existing host history tools may be used only when the user explicitly scopes the relevant conversation; do not copy raw transcripts into the skill.

Record the reusable pattern, preconditions, decision points, common failures, verification, rollback and limits. Practical experience is valuable evidence, not universal proof. Confirm the intended scope and that proprietary material may be reused before distribution.

## 2. Decide whether a new skill is needed

Check the current catalogue for duplication. Prefer an approved update or supporting reference when the knowledge belongs to an existing specialist; do not fork names merely to increase inventory. Creating a new skill must not silently replace another skill or change global instructions.

Agree a safe output directory and file touch list. Keep drafts, private knowledge notes, eval inputs and generated outputs separate from the installed/distributed skill. Preserve existing files and names when updating; review a diff and make a private backup/snapshot outside discovery paths when needed. Refuse symlink/path escapes, unsanitized output names and unapproved overwrites. Stop on concurrent edits instead of overwriting another session.

## 3. Write a small, portable draft

Use [skill-template.md](assets/skill-template.md) as a starting point, not a required directory checklist. Provide:

- A valid non-empty name/description and accurate positive/negative routing boundary.
- A short entrypoint explaining the problem, scope, inputs, workflow and acceptance evidence.
- Progressive references for variants; scripts only if they solve a real repeated need and receive a separate code review.
- Dependencies by task, version/platform limitations and source/licence notices.
- Explicit authorization for operational writes, installations, credentials, tests, costs and external recipients.
- Recovery and honest “not verified” outcomes; no made-up success, compatibility or performance claims.

Explain why important constraints exist. Do not make descriptions overly broad or “pushy”; false activation across a large catalogue is a regression. Support the host's actual metadata, including `disable-model-invocation` where appropriate. No upstream validator is bundled, and a valid frontmatter is not a security certificate.

## 4. Review the draft before executing anything

Check provenance/licence, local links, safe placeholders, confidentiality, target platform, dependency claims and absence of hidden startup behavior. Remove client identifiers, secrets, logs and operational state. Do not remove a necessary safety gate to make a template or score pass.

Create a few representative positive, negative and edge cases with meaningful outcome checks; use [eval-plan.example.json](assets/eval-plan.example.json) for the local versioned record format. Review the case set and rubric with the user before behavioral runs. A plan or fixture is not an executed evaluation.

Structural tests, safe synthetic fixtures and independent review are useful; inspect any helper before execution. Do not run an unknown skill's scripts merely to validate it. Running an operational exercise, a subagent or external model requires the separate evaluation gate below.

## 5. Optional behavior evaluation, never an automatic loop

Before any model/subagent evaluation, agree providers/recipients, model/version, tools, test inputs, output root, isolation, concurrency, repetition/time/token/cost limits, cancellation and recovery. Do not authenticate, install a CLI/MCP, inherit credentials or execute network/production tasks as a side effect. Start with synthetic data and inert tools. If real safe isolation is unavailable, keep to a documented manual comparison or decline execution and label it unrun.

Use [evaluation.md](references/evaluation.md) to compare a candidate with no-skill or the approved previous version. Record actual evidence, missing metrics and failure states. The available OPS network workers are not a generic evaluation executor: do not repurpose their constrained roles/schema or assume a Claude CLI matches Pi behavior. Host subagent use is opt-in and must retain the approved tool/data boundary.

No Claude runner, web server, automatic browser opening, process/port cleanup, archive packager or optimization loop is included. Present a local Markdown/JSON report through the host's artifact capability where available. Do not embed untrusted output into executable HTML or start a server to collect feedback.

## 6. Iterate and hand off deliberately

Fix general causes, not just the prompts that failed. Keep a baseline and change one relevant aspect at a time where practical. Use the agreed rubric, meaningful negative cases and an independent/blinded review when justified. Let ties and insufficient evidence stand. Empty feedback means no feedback, not approval. Stop on user request, budget, no progress or accepted criteria; never keep running until a favorable score appears.

Report files changed, sources, observed tests, unrun scenarios and remaining risks. Separate static validation from behavioral evidence; disclose small samples, model dependence and unavailable measurements. Updating a description is a reviewed file edit, not proof that triggering improved in every host.

For our package, update the root discovery contract/catalogue/counts and targeted tests according to the approved location; preserve other skills, prompts, runtimes and global settings. Do not package `.skill` archives, install/register a second package, commit, publish or synchronize automatically. No skill weights or model weights are trained.
