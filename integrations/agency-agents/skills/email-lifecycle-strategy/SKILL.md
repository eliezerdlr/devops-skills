---
name: email-lifecycle-strategy
description: "Plan consent-aware CRM-to-ESP lifecycle campaigns, suppression, segmentation, exit conditions and deliverability. Use for email marketing architecture, not transactional template coding or automatic campaign sending."
---

# Email lifecycle strategy

Adapted from agency-agents Email Marketing Strategist; see ../../UPSTREAM.json and ../../LICENSE.

## Boundaries
Design from sanitized supplied data. Confirm audience, jurisdictions, purpose, CRM/ESP, sender domains, consent/legal basis and owners. Legal requirements and provider features must be verified against current sources; this is not legal advice or certification.
No CRM exports/sync, DNS change, tracking activation, uploads, test sends, paid calls or publication without separate explicit authorization. Never infer marketing consent from an imported list. Use email-template-builder for transactional rendering rather than duplicating it.

## Architecture
1. Define lifecycle states and source of truth. Segment by relevant attributes, not arbitrary minimum attribute counts.
2. Specify event, timing, frequency cap, timezone, language fallback, exclusions and re-entry rules for each sequence.
3. Define immediate exit/suppression on unsubscribe, complaint, hard bounce, conversion and changed eligibility. Global suppression must win over stale CRM events; propagate revocation before queued sends.
4. Define schema mapping, null/update semantics, deduplication, idempotency, rate limits and reconciliation. ESP field types and numeric category IDs are vendor-specific, not universal.
5. Separate transactional and marketing purposes. Review SPF, DKIM, DMARC alignment, unsubscribe handling and sender reputation as evidence; propose DNS/authentication changes with rollback and authorized owners.
6. Plan synthetic/test-contact validation of rendering, links, dynamic fallbacks, state transitions, suppression races, duplicate events and recovery. Tests themselves must not contact real recipients without approval.
7. Propose small approved rollout, monitoring, complaint/bounce stop conditions and manual suspension path.

## Measurement and data minimization
Define sent/delivered, click, conversion and attributed revenue denominators and time windows. Opens are distorted by privacy proxies; CTOR inherits that denominator problem and clicks may include security bots. Label attribution uncertainty and avoid unsupported growth/ROI claims. Benchmarks are dated context, not guaranteed targets.
Tracking pixels, behavioral enrichment and third-party list verification can transfer personal data and need separate basis/approval. Retain minimal consent evidence under an agreed policy; do not collect IPs by default or invent legal retention periods. Do not fabricate reviews or customer experiences.

## Output
Sequence spec: purpose, eligible segment, exclusions, trigger, messages/CTA, exits, frequency cap, owner, legal review status and approval gate.
Integration map: fields, permissions, idempotency, suppression propagation and recovery.
Measurement plan: baseline, definitions, uncertainty, test evidence, rollout/abort thresholds and outstanding decisions.
