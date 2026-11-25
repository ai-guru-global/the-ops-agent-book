-- PLAY-09 / PostgreSQL 16.4 synthetic, desensitized READ-ONLY precheck package.
-- Supported runbook range: PostgreSQL 14-17 physical streaming replication.
-- Run each section separately through the approved read-only gateway. No credentials,
-- hostnames, query text, user names, client addresses or production rows are returned.
-- LIMIT bounds output, not internal work. Session timeouts and a concurrency limit of 1
-- remain mandatory. A timeout is not permission to retry automatically.
-- OPERATOR ACTIONS (fence, pg_wal_replay_pause, promotion, route switch, rejoin) are
-- intentionally absent. They require the immutable plan and DBA execution in section 9.8.

SET SESSION statement_timeout = '2s';
SET SESSION lock_timeout = '500ms';
SET SESSION idle_in_transaction_session_timeout = '10s';
BEGIN READ ONLY;
SET LOCAL statement_timeout = '2s';
SET LOCAL lock_timeout = '500ms';
SET LOCAL idle_in_transaction_session_timeout = '10s';

-- PG-F01: identity and role. Execute on BOTH endpoints; max 1 row each.
-- Required role permission: pg_monitor (or narrower site grants) for control functions.
SELECT current_database() AS database_name,
       current_setting('server_version') AS server_version,
       current_setting('server_version_num')::integer AS server_version_num,
       pg_control_system().system_identifier AS system_identifier,
       pg_is_in_recovery() AS is_replica;

-- PG-F02: source durable position AFTER the writer fence and quiesce; PRIMARY only.
-- pg_current_wal_flush_lsn(), not merely insert LSN, is the zero-RPO comparison target.
SELECT pg_is_in_recovery() AS is_replica,
       pg_current_wal_flush_lsn() AS source_flush_lsn,
       pg_current_wal_insert_lsn() AS source_insert_lsn,
       clock_timestamp() AS observed_at;

-- PG-F03: candidate receive/replay position and pause state; REPLICA only.
-- NULL receive/replay values are unknown, never zero. Max 1 row.
SELECT pg_is_in_recovery() AS is_replica,
       pg_last_wal_receive_lsn() AS receive_lsn,
       pg_last_wal_replay_lsn() AS replay_lsn,
       pg_last_xact_replay_timestamp() AS last_replay_timestamp,
       CASE
         WHEN pg_last_xact_replay_timestamp() IS NULL THEN NULL
         ELSE ROUND(EXTRACT(EPOCH FROM clock_timestamp() - pg_last_xact_replay_timestamp())::numeric, 3)
       END AS replay_age_s,
       pg_is_wal_replay_paused() AS replay_paused,
       clock_timestamp() AS observed_at;

-- PG-F04: sender health; PRIMARY only. No client_addr/application_name is exported.
-- Aggregate receivers so one failed receiver cannot hide behind a healthy LIMIT row.
SELECT COUNT(*) AS receiver_count,
       COUNT(*) FILTER (WHERE state = 'streaming') AS streaming_receivers,
       BOOL_OR(sync_state IN ('sync', 'quorum')) AS synchronous_receiver_present,
       BOOL_OR(replay_lsn IS NULL) AS has_unknown_replay_lsn,
       ROUND(COALESCE(MAX(EXTRACT(EPOCH FROM replay_lag)), 0)::numeric, 3) AS max_replay_lag_s,
       ROUND(COALESCE(MAX(pg_wal_lsn_diff(pg_current_wal_flush_lsn(), replay_lsn)), 0)::numeric, 0) AS max_replay_lsn_bytes
FROM pg_stat_replication;

-- PG-F05: conservative quiesce proof; PRIMARY only, run twice 2 seconds apart.
-- pg_stat_activity has no reliable per-transaction read/write flag. Therefore ANY open
-- transaction or active statement blocks promotion; the adapter treats open_transactions
-- as an upper bound for write transactions instead of guessing that a transaction is safe.
SELECT COUNT(*) FILTER (WHERE state = 'active' OR xact_start IS NOT NULL) AS active_or_in_transaction,
       COUNT(*) FILTER (WHERE xact_start IS NOT NULL) AS open_transactions,
       ROUND(COALESCE(EXTRACT(EPOCH FROM MAX(clock_timestamp() - xact_start)), 0)::numeric, 3) AS oldest_open_transaction_s
FROM pg_stat_activity
WHERE datname = current_database()
  AND backend_type = 'client backend'
  AND pid <> pg_backend_pid();

-- PG-F06: database load; execute on BOTH endpoints. OS CPU/disk evidence comes from
-- infra.metrics with the same timestamp window; SQL alone cannot prove capacity.
SELECT datname,
       numbackends,
       xact_commit,
       xact_rollback,
       blks_read,
       blks_hit
FROM pg_stat_database
WHERE datname = current_database();

-- PG-F07: replication/capacity compatibility. Sensitive primary_conninfo is reduced
-- to a boolean. Compare the complete result between source and target; max 12 rows.
SELECT name,
       setting,
       source,
       pending_restart
FROM pg_settings
WHERE name IN (
  'max_connections', 'max_worker_processes', 'max_wal_senders', 'max_replication_slots',
  'shared_buffers', 'wal_level', 'archive_mode', 'synchronous_commit'
)
UNION ALL
SELECT 'primary_conninfo_configured',
       CASE WHEN setting <> '' THEN 'true' ELSE 'false' END,
       'derived_boolean',
       false
FROM pg_settings
WHERE name = 'primary_conninfo';

-- PG-F08: route-side connection inventory, without user/query/address. Execute on BOTH.
-- The route adapter must separately prove that the endpoint revision matches this evidence.
SELECT state,
       COUNT(*) AS sessions
FROM pg_stat_activity
WHERE datname = current_database()
  AND backend_type = 'client backend'
  AND pid <> pg_backend_pid()
GROUP BY state
ORDER BY state
LIMIT 20;

COMMIT;

-- PG-F09: post-promotion role proof; execute on TARGET only after operator promotion.
-- This is still read-only. A false is_replica result must be paired with app canary/SLO evidence.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '2s';
SET LOCAL lock_timeout = '500ms';
SELECT pg_is_in_recovery() AS is_replica,
       pg_is_wal_replay_paused() AS replay_paused,
       pg_current_wal_insert_lsn() AS insert_lsn,
       pg_current_wal_flush_lsn() AS flush_lsn,
       clock_timestamp() AS observed_at;
COMMIT;

-- PG-F10: old-source rejoin health; execute ONLY after a separate approved rejoin plan.
-- Run PG-F01, PG-F03 and PG-F04 again as applicable. Role evidence does not by itself prove
-- that pg_rewind is safe; clean shutdown, timeline, WAL availability and divergence checks
-- remain operator preconditions. No rejoin command is included in this read-only file.
