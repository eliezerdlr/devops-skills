# Official Grafana dashboarding integration

The root package exposes one skill, **grafana-dashboards**, adapted from the official **dashboarding** skill in https://github.com/grafana/skills. This is not the unrelated wshobson/agents skill. No global skill installer was run.

## Installation

Use the existing single root registration:

```bash
pi install /absolute/path/to/devops-skills
```

If the root is already installed, reload/start a new session after updating it. Do not register this internal module or its upstream snapshot separately. This integration adds no hooks, extensions, agents, MCP servers, background schedules or runtime npm dependencies.

## Complete source and provenance

The complete selected skill (SKILL.md and references/json-schema.md) and root Apache-2.0 LICENSE are preserved unchanged under upstream/. UPSTREAM.json records the exact revision, hashes, included paths, local modifications and boundaries. Other marketplace skills/plugins are not installed. Related Scenes/PromQL skills are optional references, not mandatory dependencies.

Version pinned: **8fb72a527961f05e708f53d2a0500709e12d7970**. This was the fetched upstream HEAD at integration, not a promise of ongoing automatic updates.

## Dependencies

Reading/authoring requires only the skill files. An actual workflow needs an approved Grafana instance, known version, datasource and least-privilege credentials; no credentials are bundled. curl/jq are optional tools for the upstream shell examples, not package startup dependencies. Python/Node may validate JSON offline. No SQL client, Grafana Cloud subscription, Scenes SDK or new exporter is required to load this skill. Creating dashboards and expanding data collection may have costs and need approval.

## Local corrections and security review

The local entrypoint adds: provisioned source-of-truth protection; explicit write approval; UID/version/folder preservation and conflict handling; no blind overwrite; bounded queries; no token logging; percentage ratio/unit correction; schema/transform compatibility checks; no stale-as-healthy or false replication-lag claims; visual evidence limitations.

The upstream example uses overwrite:true, fixed schemaVersion 41, and a ratio labelled Error %. These remain unchanged in the archival source, not approved defaults. Its reference contains illustrative fragments/multiple JSON objects in single code fences, not standalone JSON documents. Syntax, import/schema compatibility and visual correctness are distinct checks.

Static skill-security-auditor scan: PASS, 0 findings, 2 Markdown files, 0 scripts. Manual review found the operational/semantic issues above. Pattern scanning is not a security certification; no external examples, network mutations or runtime plugins were executed.

The local asset uses modern stat/timeseries and neutral No Data states. Its metric/datasource placeholders must be replaced after discovery; it is not claimed to be a tested live RDS dashboard.

## Validation, update and rollback

Integration checks passed: 308 offline Node tests, 38 installed Pi 1.4.0 SDK tests and 11 Planning tests (357 total, no failures/skips). Actual Pi discovery contains grafana-dashboards once and excludes the archival dashboarding skill. All three upstream/license files were compared byte-for-byte with the pinned Git source. The existing root package registration was confirmed; no global configuration was changed. Reload the session to activate the updated catalogue. No live Grafana/API, SQL or visual validation was performed by this integration.

Run npm test from the repository root; the focused integration suite checks exact source inventory/hashes/license, local links, unique discovery, safeguards and illustrative layout/units. SDK tests verify real Pi discovery without live Grafana/API access.

For updates: fetch a chosen revision into a separate review checkout, inspect full skill/support-file changes and license, repeat static/manual review, replace only the reviewed snapshot, update UPSTREAM.json and tests, then run full tests. Never auto-fetch/execute on skill load.

Rollback: revert only this integration's manifest/catalogue/documentation/test changes and remove its new module; preserve unrelated work. No production rollback is needed for installing instructions. No commit/push or Grafana deployment is implied.
