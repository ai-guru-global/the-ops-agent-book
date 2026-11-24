-- SYNTHETIC / 脱敏查询包（PLAY-04，PostgreSQL 14+ 示例）。
-- 仅在专用测试只读副本运行；先由 DBA 审查角色、扩展、权限与目标。
-- 默认不输出完整 query/user/client_addr；行数上限不限制内部扫描。
SET statement_timeout = '2s';
SET lock_timeout = '500ms';
SET default_transaction_read_only = on;
BEGIN READ ONLY;

-- P01：实例与角色。
SELECT current_database() AS database_name,
       current_setting('server_version') AS server_version,
       pg_is_in_recovery() AS is_replica,
       current_user AS executing_role;  -- 角色标识仅用于本地审计，外发前脱敏

-- P02：活动会话；md5 仅作本地去重，不是用于安全取证的 SHA-256。
SELECT pid,
       state,
       wait_event_type,
       wait_event,
       ROUND(EXTRACT(EPOCH FROM clock_timestamp() - xact_start)::numeric, 3) AS transaction_age_s,
       queryid,
       md5(COALESCE(query, '')) AS query_md5_not_security_hash,
       length(query) AS query_length
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
ORDER BY xact_start NULLS LAST
LIMIT 200;

-- P03：Top statements；需要 pg_stat_statements，且不返回 query 原文。
SELECT queryid,
       calls,
       ROUND(total_exec_time::numeric, 3) AS total_exec_time_ms,
       ROUND(mean_exec_time::numeric, 3) AS mean_exec_time_ms,
       ROUND(max_exec_time::numeric, 3) AS max_exec_time_ms,
       rows,
       shared_blks_hit,
       shared_blks_read
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 20;

-- P04：阻塞链；深度硬上限 4，避免递归展开爆炸。
WITH RECURSIVE blockers AS (
  SELECT a.pid,
         a.pid AS root_pid,
         0 AS depth,
         a.wait_event_type,
         a.wait_event,
         ROUND(EXTRACT(EPOCH FROM clock_timestamp() - a.xact_start)::numeric, 3) AS transaction_age_s
  FROM pg_stat_activity AS a
  WHERE a.datname = current_database()
    AND a.pid <> pg_backend_pid()
    AND a.wait_event_type = 'Lock'
  UNION ALL
  SELECT a.pid,
         b.root_pid,
         b.depth + 1,
         a.wait_event_type,
         a.wait_event,
         ROUND(EXTRACT(EPOCH FROM clock_timestamp() - a.xact_start)::numeric, 3) AS transaction_age_s
  FROM blockers AS b
  JOIN pg_stat_activity AS a ON a.pid = ANY(pg_blocking_pids(b.pid))
  WHERE b.depth < 4
    AND a.pid <> b.root_pid
)
SELECT DISTINCT root_pid, pid, depth, wait_event_type, wait_event, transaction_age_s
FROM blockers
ORDER BY root_pid, depth, pid
LIMIT 100;

-- P05：仅在主库执行；备库通常没有 pg_stat_replication 行，空结果不是零延迟。
SELECT state,
       sync_state,
       write_lag,
       flush_lag,
       replay_lag,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lsn_bytes
FROM pg_stat_replication
LIMIT 100;

-- P06：仅在备库执行；replay_age 是时间戳估算，不替代 LSN/GTID 一致性判断。
SELECT pg_is_in_recovery() AS is_replica,
       pg_last_wal_receive_lsn() AS receive_lsn,
       pg_last_wal_replay_lsn() AS replay_lsn,
       pg_last_xact_replay_timestamp() AS last_replay_timestamp,
       CASE
         WHEN pg_last_xact_replay_timestamp() IS NULL THEN NULL
         ELSE ROUND(EXTRACT(EPOCH FROM clock_timestamp() - pg_last_xact_replay_timestamp())::numeric, 3)
       END AS replay_age_s;

COMMIT;

-- 估计计划：不执行 SELECT。
EXPLAIN (COSTS true, ANALYZE false, BUFFERS true, FORMAT JSON)
SELECT id, status
FROM synthetic_orders
WHERE tenant_id = 42
  AND created_at >= TIMESTAMPTZ '2026-11-24 00:00:00Z'
ORDER BY created_at DESC
LIMIT 100;

-- 仅在隔离测试副本、成本审批和超时确认后，由 DBA 取消注释。
-- EXPLAIN ANALYZE 会真正执行 SELECT 及其函数；LIMIT 不保证内部不做完整扫描。
-- EXPLAIN (ANALYZE true, BUFFERS true, TIMING true, FORMAT TEXT)
-- SELECT id, status FROM synthetic_orders
-- WHERE tenant_id = 42 AND created_at >= TIMESTAMPTZ '2026-11-24 00:00:00Z'
-- ORDER BY created_at DESC LIMIT 100;

-- 审计：保存实际会话设置、原始查询、参数、时间范围、行数、结果 SHA-256、TTL 与实例版本。
-- 本文件不含 DDL/DML/kill/failover/restore；这些动作只能走 DBA 变更与恢复演练门禁。
