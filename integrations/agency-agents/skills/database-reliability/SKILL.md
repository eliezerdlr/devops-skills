---
name: database-reliability
description: "Review database recoverability, PITR, replication, fencing, pooling and safe schema-change budgets. Use for DBRE and restore/failover planning, not generic schema design or query tuning."
---

# Database reliability

Adapted from agency-agents Database Reliability Engineer; see ../../UPSTREAM.json and ../../LICENSE.

## Approval boundary
Default to supplied evidence and read-only review. Identify engine/version, managed or self-hosted topology, owners, data classification and business RPO/RTO. Do not query production, restore customer data, install poolers, promote replicas, run DDL or schedule drills without separate approval, scope, budget and recovery access.

## Recoverability
Inventory base backups, WAL/binlog continuity, retention, encryption keys, privileges and cross-account/region dependencies. A successful backup job is not proof of restore. Propose an isolated restore with protected data, bounded cost, integrity and application checks; measure achieved recovery point and end-to-end recovery time, including access and endpoint recovery. Record evidence date and cleanup approval. Unknown or untested is not passed.

## HA and failover
Map replication mode, durable acknowledgement semantics, quorum, fencing, lag, endpoints and failure domains. Synchronous replication alone is not a universal no-data-loss guarantee. Inspect the candidate's replay position; state possible write loss and get business approval before promotion. Include old-primary isolation and failback/reconciliation. Never promote a lagging replica merely because it is available.

## Safe change
Use migration-architect for broader migrations. Review expand/contract compatibility with all deployed writers, lock modes, transaction boundaries, replication/WAL impact and capacity. Set engine-specific lock/statement budgets in the proposed change, not universal copied values. Backfill bounded idempotent batches separately from exclusive DDL; validate invariants before contract.
For PostgreSQL, NOT VALID CHECK still constrains new/updated rows; concurrent index creation can leave an invalid index. Confirm actual engine/version behavior before giving commands. A rollback of application code may be unsafe after constraints tighten. Mark irreversibility and recovery alternative explicitly.

## Connection and capacity review
Measure per-service connections, queueing, long transactions, storage/IOPS and replication retention. Pooling and backpressure are options whose transaction/session semantics and managed-service limits must be evaluated, not mandatory installations.

## Deliverable
Evidence matrix; RPO/RTO target versus measured or unknown; topology and failure scenarios; proposed restore/failover runbook with exact gates, abort criteria and recovery; migration compatibility/lock budget; owner, maintenance window and unresolved risks. Do not promise zero downtime or zero loss without measured, scoped evidence.
