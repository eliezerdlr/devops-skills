---
name: prometheus-label-strategy
license: Apache-2.0
description: Review and design Prometheus labels, cardinality, churn, histogram series and metadata joins for local Prometheus or Grafana Cloud. Use when preventing unbounded labels, assessing label changes, preserving series identity or planning evidence-led cardinality improvements.
---

# Prometheus label strategy — bounded, evidence-led review

Adapted from Grafana Labs' official skill, Apache-2.0. **Local modifications:** the corrections and safety boundaries below qualify the unchanged source examples. Read the [complete official skill](../../upstream/skills/grafana-cloud/prometheus-label-strategy/SKILL.md), then apply these corrections. See [provenance](../../UPSTREAM.json), [LICENSE](../../upstream/LICENSE), [integration guide](../../README.md) and [review checklist](references/review-checklist.md).

## Scope and permission

Start with supplied, scoped evidence; distinguish design from incident diagnosis or changes. Confirm local Prometheus/Mimir versus Grafana Cloud, versions, instrumentation/client, storage/remote-write topology, required queries/alerts and a review budget. Do not assume a Cloud subscription or install other skills/tools.

No live queries, repository-wide scans, credential retrieval, uploads, new labels, relabeling, feature flags, recording rules or deployment are authorized by loading this skill. Actual collection requires approved endpoints, selectors, time/series limits and privacy scope. Actual changes require a reviewed source diff, migration/rollback and separate deployment approval. Keep enterprise configuration and inventories in their own IaC repositories; this package contains reusable guidance only.

## Preserve measurement identity, not just syntax

Never drop or normalize a distinguishing label at scrape/remote-write time merely to reduce cardinality. `labeldrop` and status-code collapsing can turn distinct counters into collisions; independent reset histories cannot be reconstructed by a later `rate()`. Outcomes depend on collector/storage/version: rejected duplicates, discarded samples, errors or incorrect values; increased DPM is not a guaranteed symptom.

Before removing even an apparently duplicated label, prove that **metric name plus the remaining labels remains unique** over all targets and relevant rollout/time windows. Check target/sample collisions, `honor_labels`, external labels, replicas and downstream identity. A duplicate-looking label is not automatically safe to remove. Rewrite friendly `instance` values only if uniqueness survives.

Prevention at instrumentation is preferable, but changing application label schemas is not consequence-free. Aggregate within the instrumentation correctly, preserve independent counters, plan series continuity and update consumers. An info metric can concentrate metadata churn; it does not eliminate historical series.

## Corrections to numerical and platform assumptions

- The product of label cardinalities is a **possible-combinations upper model**, not a measured count: correlated labels and absent combinations matter. Distinguish per-label distinct values, observed active series, peak activity, retained series and churn over a named interval. Do not equate 100% daily churn with a universal 2× retention cost.
- Classic histograms: if **B** is the observed number of exported bucket series **including +Inf**, a common per-label-set count is **B + 2 + C** (`_sum`, `_count`, plus optional `_created`, C=0 or 1). Confirm actual exposition/client behaviour; there is no universal 14× multiplier. Native histograms need compatible end-to-end versions/configuration and accuracy checks, not an automatic conversion.
- Label values are strings. An unquoted numeric value in a JSON/YAML producer representation versus a quoted one is not inherently two different Prometheus label values. Case, route formatting and actual exported strings can differ.
- Static labels are bounded, not free. They can split series across targets/history; discoverable identity and cross-cluster/tenant uniqueness still matter. Assign ownership between application, discovery, scrape and external labels per metric type; application labels are not universally forbidden.
- Grafana Cloud **Adaptive Metrics is optional**, not the only safe cost-reduction mechanism. Consider correct source aggregation, narrower instrumentation, removing entire unused metrics/targets, selective forwarding, retention, scrape frequency and supported storage-side aggregation according to required semantics and backend. Each can lose information and has its own constraints.
- Recording rules generally add stored rollups while raw series remain: they can improve query efficiency, **not automatically reduce ingest cost**. A longer scrape interval changes temporal fidelity and sample volume, not necessarily active-series count or billing. No universal savings or bill estimate without measured rates and the actual pricing model.

## Metadata joins and exemplars

Join before aggregating away the identity needed for the match. The right-hand info series must be unique on the full chosen matching key; `on(app)` can become ambiguous during multi-instance/multi-version rollouts. Include cluster/tenant/target keys as needed, check unmatched and multiply matched series, and do not blindly deduplicate differing build metadata.

Use `info()` only after checking the installed version, feature flag, supported info metric and identifying-label behaviour. It operates on an instant vector, not an arbitrary range vector; its optional selector must be checked against the actual implementation. The explicit unique-key join is often more portable, but still needs testing.

**Exemplar correction:** `follow_redirects` controls HTTP redirects; it does **not enable exemplars**. `enable_protobuf_negotiation` alone is not a universal exemplar switch either. Verify client exemplar support, negotiated exposition format, server feature/config/storage, scrape or remote-write support, retention and Grafana datasource settings for the installed versions. Do not copy the upstream example as an enablement recipe. Trace/request IDs and links can be sensitive: approve recipients/access/retention, and never put arbitrary PII into exemplars.

## Deliver a decision-ready assessment

Use the [checklist/report structure](references/review-checklist.md). Record supplied versus observed evidence, counting method/window/limits, label purpose, query consumers, identity risks, options and expected trade-offs. Leave unavailable metrics unknown instead of manufacturing estimates.

Validate proposed instrumentation/relabel/rule changes with representative multi-target, restart and rollout fixtures; use the environment's approved `promtool`/Alloy checks when available. A parser pass does not prove uniqueness, counter semantics, savings or operational safety. Preserve rollback and assess irreversible historical data loss before applying anything.

Related upstream skills (`adaptive-metrics`, `dpm-finder`, `prometheus-cardinality-troubleshooter`, `promql`, `alloy`) are optional workflow boundaries, not bundled runtime requirements. Do not fetch/install them automatically. Use `grafana-dashboards` for dashboard authoring, not as proof of metric correctness.
