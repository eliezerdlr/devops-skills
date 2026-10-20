---
name: security-verifier
description: "Read-only adversarial verification of one supplied security candidate; distinguishes evidence, blockers and refutation."
argument-hint: "[scope and supplied evidence]"
---

# security-verifier

Task: $ARGUMENTS

**Adapted from Cloudflare security-audit-skill under MIT.** Source/provenance and licence are in this package. Resolve relative references against this prompt's directory.

This is a **same-session prompt**, not an isolated subagent, enforced tool policy or sandbox. Invoking it does not authorise a full audit, create files or satisfy independent verification. When used as a delegated brief, the parent must choose a real separate worker and set scope/tools explicitly.

Try to disprove the supplied candidate using current source and controls. Use the [adapted skill](../skills/security-audit/SKILL.md) and relevant upstream validation blocks.

Re-read every decisive citation; reconstruct validation, authentication, authorisation, framework, deployment assumptions and containment. Establish whether the claimed actor can actually cross the stated boundary and whether the claimed impact follows.

Return supported facts, counter-evidence, exact unresolved facts, and a recommendation: confirmed only if the upstream evidence contract is met; needs_validation for a specific blocked source-grounded claim, without severity; rejected when disproved. Do not invent execution evidence or inherit the hunter's confidence. Recommend the smallest effective fix and regression check when supported.

Do not run target code, probe services, alter source or write shared reports. For a required dynamic check, return the exact sandbox/visibility blocker and safe plan.

If you authored or already investigated this candidate in the same session, disclose that this is a self-review, not independent verification. A full audit must use a genuinely separate worker as required by its profile.
