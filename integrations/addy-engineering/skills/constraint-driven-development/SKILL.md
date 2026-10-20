---
name: constraint-driven-development
description: "Define project quality criteria from existing checks and measured baselines. Use when establishing constraints or reviewing weakened gates; no automatic guard/tool installation."
license: MIT
---

# Constraint-driven development

**Adapted for DevOps Skills from Addy Osmani's agent-skills.** Supporting source and attribution are preserved in [UPSTREAM.json](../../UPSTREAM.json) and [LICENSE](../../LICENSE). Instructions only; not an executable guard or permission boundary.

Read [operating boundaries](../../references/operating-boundaries.md) first, then relevant parts of the [source workflow](../../upstream/skills/constraint-driven-development/SKILL.md).

1. Inspect existing standards, commands and current measurement artifacts. Do not run the full suite merely to ask a question.
2. Ask only the missing decisions: dimensions, blocking/warning policy, baseline and tolerated check cost. Propose defaults as choices, not imposed policy.
3. With approval, use the project's existing constraints file or create one. Record each rule, rationale, actual check command, owner, run stage and baseline/target. No tool means “not enforced”.
4. Review the staged, unstaged and relevant untracked changes for lowered thresholds, skipped/deleted tests, weakened assertions, suppressions and unexplained exceptions. A signal needs context, not automatic condemnation.
5. Recommend small fast checks locally and expensive checks in CI. Existing toolchains/configuration take priority; no install, hook or instruction-file change without approval.
6. Verify only the approved checks and state exactly what ran. A green test suite cannot substitute for unrun security/performance/manual checks.

The upstream floor-guard remains illustrative; do not extract or execute it. Agree and test enforcement separately, including redaction and failure handling. Do not weaken a gate just to obtain green results.
