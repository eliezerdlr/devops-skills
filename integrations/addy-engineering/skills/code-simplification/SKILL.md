---
name: code-simplification
description: "Simplify a scoped diff while preserving contracts, return types, side effects and error behavior. Use for targeted refactoring; no automatic commits, blanket rewrites or weakened tests."
license: MIT
---

# Code simplification

**Adapted for DevOps Skills from Addy Osmani's agent-skills.** Supporting source and attribution are preserved in [UPSTREAM.json](../../UPSTREAM.json) and [LICENSE](../../LICENSE). Instructions only; not an executable guard or permission boundary.

Read [operating boundaries](../../references/operating-boundaries.md), then selected [source principles](../../upstream/skills/code-simplification/SKILL.md). Examples are not verified equivalence rules.

1. Confirm the scope and expected behavior; inspect relevant callers/tests and reasons for existing complexity before editing.
2. Identify one concrete readability problem. Prefer the current project's conventions over external style preferences.
3. Propose a small behavior-preserving change, separate from unrelated feature work. Obtain approval where scope is not already authorised.
4. Preserve types, exceptions/rejections, identity, side effects, ordering, timing and concurrency. Replacing objects with Maps or removing async wrappers can change the contract.
5. Run the approved targeted regressions and relevant type/build checks. Never remove assertions, skip tests or lower constraints to validate the refactor.
6. Re-read the diff. Report changes, checks and residual equivalence uncertainty; keep or undo only your own edits as appropriate.

No automatic commit/push, sweeping codemod or dependency installation. If the contract is unclear or tests are inadequate, request clarification or a regression test before simplifying. Fewer lines is not evidence of improvement.
