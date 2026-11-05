# Prometheus label strategy — official Grafana source

One reusable skill, **prometheus-label-strategy**, from https://github.com/grafana/skills at reviewed revision **8fb72a527961f05e708f53d2a0500709e12d7970**. Source: skills/grafana-cloud/prometheus-label-strategy/SKILL.md. Copyright 2026 Grafana Labs; Apache-2.0.

## Installation and dependencies

Included through the single root package:

```bash
pi install /absolute/path/to/devops-skills
```

If the root is already registered, reload the session after updating it. Do not register this internal component or its snapshot separately. The local entrypoint keeps the upstream name. Reading instructions requires no Prometheus, Grafana Cloud account, MCP, SDK, new tool, credential or network access.

The complete selected upstream skill and LICENSE are preserved unchanged under upstream/. UPSTREAM.json records the revision and source hashes; it does not claim to track future HEAD automatically. Other marketplace skills are not required to load it and are not silently installed.

Operational diagnosis needs existing approved Prometheus/backend access, compatible tooling and a bounded query/data budget. Actual configuration/rule changes need their own reviewed source, tests, approval and rollback. No hooks, runtime dependencies, schedules, exporters, infrastructure changes or credential discovery are added.

## Local corrections

The [local skill](skills/prometheus-label-strategy/SKILL.md) retains the full source via a direct link and explicitly qualifies its examples:

- Preserve full series identity and independent counter reset histories; duplicate-looking labels need evidence before removal.
- Product-of-cardinalities estimates and churn multipliers are not universal observed counts.
- Histogram series counts depend on actual buckets/+Inf/sum/count/optional-created/client behaviour; native histograms are version-dependent.
- Target labels are bounded, not free; exported label values are strings.
- Adaptive Metrics is optional Grafana Cloud functionality, not the only possible safe strategy for local Prometheus or another backend.
- Recording rules add rollups but do not automatically lower ingestion or bills.
- Info joins need a unique full key across targets/rollouts; application-only joins can be ambiguous.
- follow_redirects and enable_protobuf_negotiation do not, by themselves, enable exemplars. Protocol/client/server/storage support and privacy controls need verification.

The [checklist](skills/prometheus-label-strategy/references/review-checklist.md) and [synthetic fixture](assets/review.example.json) support a decision-ready review. Neither is a production configuration, measured savings report or guarantee of correct future model behaviour.

## Review, tests and limits

Static skill-security-auditor scan of the selected upstream skill: PASS, zero findings, one Markdown file, zero scripts. Manual review identified the technical caveats above. This is not a security certification; no live service or source example was executed.

The focused test suite checks provenance/license/full snapshot inventory, links and discovery, local safeguards and synthetic identity/cardinality/histogram invariants. The root tests and installed Pi SDK discovery cover integration without querying Prometheus/Grafana/AWS. Parser and textual contracts do not prove production correctness, savings, privacy enforcement or counter semantics on real data.

## Separation, updates and rollback

Only reusable guidance and synthetic examples belong here. Enterprise inventory, credentials, dashboards and Prometheus/Ansible/Terraform configuration remain in their own repositories and require separately authorized changes.

For updates, inspect a chosen new source revision, compare the complete selected skill and license, re-review corrections, update provenance/hashes and rerun offline/SDK tests. No automatic fetch or installation is performed on load.

Rollback removes only this module's root registration, catalogue/docs/test entries and new files, preserving unrelated changes. No production rollback or cloud operation is part of installing these instructions.
