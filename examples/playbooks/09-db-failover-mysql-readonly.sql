-- PLAY-09 / MySQL 8.0.40 synthetic, desensitized READ-ONLY precheck package.
-- Supported runbook range: MySQL 8.0.36+ or 8.4 InnoDB Cluster / Group Replication.
-- Asynchronous InnoDB replication is OUT OF SCOPE: file/position and GTID failover need a
-- separately validated topology adapter. No generic CHANGE REPLICATION SOURCE is provided.
-- Run each section separately through the approved read-only gateway. No credentials,
-- hostnames, users, SQL text or production rows are returned. LIMIT bounds output, not scans.
-- OPERATOR ACTIONS (fence, Cluster.setPrimaryInstance, route switch, rejoin) are absent.
-- They require the immutable plan and DBA execution in section 9.9.

SET SESSION MAX_EXECUTION_TIME = 2000;       -- milliseconds; SELECT support must be verified
SET SESSION innodb_lock_wait_timeout = 2;    -- seconds; InnoDB row locks
SET SESSION lock_wait_timeout = 2;           -- seconds; metadata locks
START TRANSACTION READ ONLY;

-- MY-F01: identity and global write guards; execute on BOTH endpoints. Max 1 row each.
-- super_read_only is defense in depth, NOT a complete writer fence.
SELECT @@port AS port,
       @@version AS server_version,
       @@read_only AS read_only,
       @@super_read_only AS super_read_only,
       @@gtid_mode AS gtid_mode;

-- MY-F02: Group Replication membership; execute on BOTH endpoints. Max 8 rows.
-- MEMBER_ID and MEMBER_HOST stay in the local secure adapter; evidence exports only a digest.
-- A healthy group for this runbook has exactly one PRIMARY and all other members ONLINE.
SELECT SHA2(MEMBER_ID, 256) AS member_id_sha256,
       MEMBER_ROLE,
       MEMBER_STATE,
       COUNT_TRANSACTIONS_IN_QUEUE,
       COUNT_TRANSACTIONS_CHECKED
FROM performance_schema.replication_group_members
ORDER BY MEMBER_ROLE, MEMBER_ID
LIMIT 8;

-- MY-F03: GTID position; execute on BOTH endpoints. Max 1 row each.
-- The adapter canonicalizes and compares GTID sets; raw output is capped at 1 MiB and is
-- never pasted into tickets. Equality is not assumed: prove source set SUBSET OF target set.
SELECT @@GLOBAL.gtid_executed AS gtid_executed,
       @@GLOBAL.gtid_purged AS gtid_purged,
       @@GLOBAL.gtid_mode AS gtid_mode;

-- MY-F04: conservative transaction quiesce; execute on SOURCE PRIMARY only, twice 2s apart.
-- Counts cover InnoDB transactions visible in information_schema at each snapshot. Zero in
-- both samples plus every writer acknowledgement is required; the SQL snapshot alone is not
-- a fence and cannot account for an un-inventoried writer.
SELECT COUNT(*) AS active_transactions,
       COALESCE(SUM(trx_is_read_only = 0), 0) AS active_write_transactions,
       COALESCE(MAX(TIMESTAMPDIFF(MICROSECOND, trx_started, NOW(6))) / 1000000, 0) AS oldest_transaction_s
FROM information_schema.innodb_trx;

-- MY-F05: replication/capacity compatibility; execute on BOTH endpoints. Max 1 row each.
SELECT @@GLOBAL.log_bin AS log_bin,
       @@GLOBAL.binlog_format AS binlog_format,
       @@GLOBAL.gtid_mode AS gtid_mode,
       @@GLOBAL.innodb_flush_log_at_trx_commit AS innodb_flush_log_at_trx_commit,
       @@GLOBAL.sync_binlog AS sync_binlog,
       @@GLOBAL.group_replication_consistency AS group_replication_consistency,
       @@GLOBAL.transaction_write_set_extraction AS transaction_write_set_extraction,
       @@GLOBAL.replica_parallel_type AS replica_parallel_type,
       @@GLOBAL.replica_parallel_workers AS replica_parallel_workers,
       @@GLOBAL.max_connections AS max_connections,
       SHA2(@@GLOBAL.group_replication_group_name, 256) AS group_name_sha256;

-- MY-F06: connection/error budget; execute on BOTH endpoints. Max 5 rows.
-- CPU, disk and latency must come from infra.metrics with the same observation window.
SHOW GLOBAL STATUS WHERE Variable_name IN (
  'Threads_connected', 'Threads_running', 'Max_used_connections', 'Aborted_clients', 'Aborted_connects'
);

-- MY-F07: lock-wait pressure; execute on BOTH endpoints. Max 1 row.
-- Requires PROCESS plus performance_schema/data-lock instrumentation. Missing permission is
-- UNKNOWN, not zero. Do not join/export lock data, users, hosts or SQL text.
SELECT COUNT(*) AS lock_wait_edges
FROM performance_schema.data_lock_waits;

COMMIT;

-- MY-F08: post-switchover membership proof; execute on TARGET and then the other members.
-- The adapter must observe exactly one PRIMARY, the approved target as PRIMARY, no ERROR or
-- RECOVERING members, and an empty target applier queue. A client exit code alone is insufficient.
START TRANSACTION READ ONLY;
SELECT SHA2(MEMBER_ID, 256) AS member_id_sha256,
       MEMBER_ROLE,
       MEMBER_STATE,
       COUNT_TRANSACTIONS_IN_QUEUE,
       COUNT_TRANSACTIONS_CHECKED
FROM performance_schema.replication_group_members
ORDER BY MEMBER_ROLE, MEMBER_ID
LIMIT 8;
COMMIT;

-- MY-F09: old-source rejoin health; execute ONLY after a separate approved rejoin plan.
-- Repeat MY-F01/MY-F02/MY-F03 on the isolated old source and current primary. Local divergent
-- writes require clone/rebuild rather than a blind rejoin. No RESET MASTER, RESET REPLICA,
-- CHANGE REPLICATION SOURCE, SET GLOBAL or forced-election command is included here.
