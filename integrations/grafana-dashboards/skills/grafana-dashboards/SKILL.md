---
name: grafana-dashboards
description: Create, review and improve modern Grafana dashboards, panels, variables, transformations and provisioning. Use when designing dashboards, validating PromQL-backed panels, reviewing dashboard JSON or planning safe Grafana dashboard updates.
license: Apache-2.0
---

# Grafana dashboards

Local adaptation of Grafana Labs' official `dashboarding` skill. **Modified guidance:** safety gates, version checks, percentage semantics and provisioned-source workflow below override unsafe assumptions in examples. Full unchanged [official skill](../../upstream/skills/grafana-core/dashboarding/SKILL.md) and [JSON reference](../../upstream/skills/grafana-core/dashboarding/references/json-schema.md) are bundled; read them when authoring. See [integration and dependencies](../../README.md).

## Discover before designing

- Confirm approved instance, organisation, scope, version and intended deliverable. Installing this skill does not authorize any network access or change.
- With permission, inspect existing dashboards, UID/folder/version/provisioning, datasource UID/type, real metrics/labels, units, interval and retention. Never guess credentials or retrieve unrelated secrets.
- Query only approved sources within bounded time/series limits. SQL queries, new exporters, plugins, alert rules, paid services and load tests require separate scope/approval.
- Never embed tokens, internal inventory, live samples with PII, passwords or datasource secrets in reusable files. Use the approved credential mechanism; do not echo tokens or disable TLS verification.
- Provisioned dashboard: modify the reviewed source of truth (Ansible/Terraform/GitOps), not runtime UI/API. Loading this skill never runs a playbook or Terraform apply.

## Design and semantics

Use overview KPIs → performance trends → capacity → collection health. Prefer modern `stat`/`timeseries` panels with `fieldConfig`, a 24-column grid, explicit units, consistent colours and descriptions. Separate unrelated scales. Derive thresholds from an agreed SLO/capacity baseline, not arbitrary examples.

Verify datasource UID and Grafana version; do not assume the reference's schemaVersion 41 is universal for all Grafana 11+ releases. Preserve the target's compatible schema or validate the chosen format. Examples are not server-side schema validation.

- CPU 0–100: `percent`; ratios 0–1: `percentunit`; bytes vs bytes/sec vs bits/sec must remain distinct; seconds vs milliseconds need explicit conversion.
- **Correction to upstream "Error %":** errors/total yields a ratio, not a 0–100 percentage. Use errors/total with `percentunit`, or multiply by 100 and use `percent`. Guard zero/missing denominators explicitly; never silently turn no traffic or missing data into healthy zero.
- Inspect the frames and installed transformation identifiers/options. Upstream snippets, including transformation names, must be verified against the actual server, not blindly copied.
- Use rate on counters, not gauges. Do not manufacture p95/p99 from averages. Histogram quantiles require appropriate buckets and labels.
- Multi-value variables require suitable regex interpolation/escaping; scope high-cardinality queries. Avoid unbounded "All" queries.
- Separate No Data, stale data, missing series and errors from healthy values. `lastNotNull` can hide outages. Refresh time and Prometheus scrape timestamp do not prove original CloudWatch datapoint freshness.
- RDS synchronous Multi-AZ standby does not expose read-replica `ReplicaLag`. Scrape UP does not prove database/application health; new collection can incur AWS API and infrastructure costs.

Use the [local illustrative template](../../assets/dashboard.example.json) only after replacing datasource/metric placeholders. It makes no network requests and is not a production RDS dashboard.

## Validate and deliver

1. Parse JSON; check unique panel IDs, grid boundaries/overlap, UID/folder, datasource references, units, legends, links, variables and no secrets. Syntax passing is not Grafana compatibility.
2. Test approved queries for data, empty results, stale values, error states and representative ranges. Report coverage and limitations.
3. For provisioned resources: supply a source diff, review, backup/recovery plan and the separately approved deployment procedure.
4. For an explicitly approved non-provisioned API write: GET and save a protected backup first; preserve UID/folder/version and unrelated settings; recheck version before a single write. Do not blindly copy upstream `overwrite: true` or retry on conflict. Stop on concurrent changes or uncertain responses.
5. Confirm returned UID/version/status, then GET and compare the intended fields. Record what was changed, cost impact and recovery steps. No automatic rollback/delete.
6. Visual inspection is a separate check: only use the user's browser if explicitly requested/allowed; otherwise report it as not performed. Do not claim a polished or working rendered dashboard from API readback alone.

No scheduling, alerts, contact points, source changes, dashboard deletion, MCP installation or credential setup is implicit. Related Grafana skills and Scenes are optional for other tasks, not runtime dependencies of this one.
