# Reusable skill draft template

Adapted from Anthropic skill-creator writing guidance. Apache-2.0, Copyright 2026 Anthropic, PBC. Local changes: source/evidence, negative routing, operational gates and honest acceptance. See ../LICENSE and ../UPSTREAM.json.

This is a template, not a discoverable SKILL.md, validated final output or authorization to create a new skill. Replace documentary placeholders in an approved draft location, never in this installed template. Avoid empty metadata and check supported host fields; add `disable-model-invocation: true` for user-only workflows where supported.

```markdown
---
name: example-specialist
description: "Solve a specific recurring problem for a defined user intent. State relevant triggers and exclusions accurately."
license: LICENCE_TO_VERIFY
---

# TITLE

## Source and evidence
User-authorized expertise/source, rights to reuse, version/date and changes. Distinguish observed, reported, inferred, proposed and unverified.

## Scope and inputs
What problem is solved, what is needed, and what is explicitly out of scope. Do not collect private data or histories automatically.

## Prerequisites and approval
Dependencies per task, tested platforms/versions, read-only starting point and separate approval for execution, data recipients, credentials, costs or disruptive changes. Reading instructions does not authorize operations.

## Workflow
Concise repeatable decisions and steps. Put substantial variants in referenced documents, and inspect helpers before execution.

## Verification
Observable expected results, negative/denied cases, uncertainty and failure handling. Do not claim successful operation or measured performance from static source alone.

## Recovery and limits
Scoped rollback, independent recovery path where necessary, known gaps and stop conditions.

## References
Only relevant verified local/source links and required licences, not unrelated context or live secrets.
```

Before distribution, review the draft and links, licence/provenance, catalogue registration and tests. A new skill does not need scripts/assets/agents merely to look complete; add only what the workflow actually uses. Commit, install and publish require separate approval.
