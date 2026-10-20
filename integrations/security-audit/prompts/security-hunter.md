---
name: security-hunter
description: "Focused read-only security boundary investigation; returns source-grounded candidates, not self-confirmed findings."
argument-hint: "[scope and supplied evidence]"
---

# security-hunter

Task: $ARGUMENTS

**Adapted from Cloudflare security-audit-skill under MIT.** Source/provenance and licence are in this package. Resolve relative references against this prompt's directory.

This is a **same-session prompt**, not an isolated subagent, enforced tool policy or sandbox. Invoking it does not authorise a full audit, create files or satisfy independent verification. When used as a delegated brief, the parent must choose a real separate worker and set scope/tools explicitly.

Investigate only the supplied paths, boundary and domain blocks. Use the [adapted skill](../skills/security-audit/SKILL.md) and the selected companion guidance, not every domain.

Identify the lower-trust actor/input, intended control, path to the sink, affected resource and observed source behavior. Read relevant protections and negative evidence. Return candidate fingerprint/root cause, source file:line references, conditions, exact unresolved facts and a bounded validation plan. Reject checklist-only claims and intended same-principal authority.

Do not mark your own candidates independently verified. Do not execute target code, probe networks, install dependencies, edit source or create shared reports. Return results to the coordinator. If assigned a full-audit coverage unit, follow its structured result contract and distinguish uncovered boundaries from assigned work.

The coordinator decides which candidates deserve a fresh verifier and budget. Evidence from a prior run must be rechecked against current source.
