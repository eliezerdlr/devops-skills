# Label strategy review checklist

Local Apache-2.0 adaptation/addition; complete Grafana source is archived separately.

## Evidence and scope

1. Identify local/Cloud backend, version/client, scrape/remote-write topology, allowed endpoints and query/time/series budget.
2. Use redacted supplied metrics, rules and queries first; avoid full-corpus `/series` or label-value scans without explicit bounds/approval.
3. Inventory metric families, counter/gauge/histogram types, targets, replica/tenant/cluster identity, existing consumers and intended resolution.
4. Measure observed active/peak/retained series and churn in distinct named windows. Report truncation, missing evidence and estimates separately.
5. Inventory actual histogram bucket samples including +Inf, sum/count/created and native-histogram compatibility.

## Change review

- For each label: purpose, bounded exported values, owner, observed count, churn, consumer and identity necessity.
- Compute possible-combination bounds only with explicit assumptions; never call the product the measured series count.
- Compare full before/after identity tuples across multiple targets, restarts, replicas and rollouts.
- Reject distinguishing-label removal or many-to-one normalization without correct aggregation semantics. Whole-metric dropping is deliberate information loss and still needs approval.
- Validate counter reset semantics before aggregation; preserve an appropriate order such as sum of per-series rates, not rate of a sum of independent counters.
- Test info joins for exactly one RHS match on the full key, no unmatched metrics and preserved build attribution. No `on(app)` shortcut during multi-version deployment.
- Separate source prevention, query rollups, sample-frequency controls, retention and backend aggregation. Explain where raw data remain or become unrecoverable.
- Treat exemplar metadata as governed data; verify actual client/protocol/server support. Redirect settings are not exemplar enablement.
- Check alert/dashboard/rule consumers before schema changes and plan continuity, rollback and historical interpretation.

## Deliverable

| Family | Label | Observed values/window | Query consumer | Identity risk | Proposed action | Evidence/confidence |
|---|---|---|---|---|---|---|
| supplied example | bounded key | unknown until measured | supplied query or unknown | explicitly assessed | proposal only | source reference |

Report:
- Scope, platform/version and evidence source.
- Findings and strengths, with unknowns and bounded counting methodology.
- Options and semantic/data/cost trade-offs; no unsupported savings.
- Proposed source diff and validation cases; not applied by this review.
- Approval required, rollout checks, rollback and irreversible-loss caveats.

The [synthetic fixture](../../../assets/review.example.json) demonstrates why deleting a distinguishing label is unsafe. It is not a live configuration, benchmark or cost estimate.
