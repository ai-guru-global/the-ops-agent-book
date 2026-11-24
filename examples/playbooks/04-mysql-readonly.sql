-- SYNTHETIC / 脱敏查询包（PLAY-04，MySQL 8.0+）。
-- 仅在专用测试只读副本运行；先由 DBA 审查权限、版本与目标。
-- 默认不输出完整 SQL/用户/主机；SHOW REPLICA STATUS 必须再次删除 host/user/凭据。
-- 行数上限限制返回，不限制内部扫描；statement timeout 仍是硬门禁的一部分。

SET SESSION MAX_EXECUTION_TIME = 2000;       -- 毫秒；先验证当前版本/语句支持
SET SESSION innodb_lock_wait_timeout = 2;    -- 秒；InnoDB 行锁
SET SESSION lock_wait_timeout = 2;           -- 秒；元数据锁
START TRANSACTION READ ONLY;

-- M01：实例与只读角色。hostname 外发前脱敏。
SELECT @@hostname AS hostname,
       @@port AS port,
       @@version AS version,
       @@read_only AS read_only,
       @@super_read_only AS super_read_only;

-- M02：活动会话；INFO 不返回，仅保留不可逆定位摘要。
SELECT ID,
       LEFT(DB, 64) AS database_name,
       COMMAND,
       TIME AS active_seconds,
       STATE,
       SHA2(COALESCE(INFO, ''), 256) AS sql_sha256
FROM information_schema.PROCESSLIST
ORDER BY TIME DESC, ID
LIMIT 200;

-- M03：Top digest。DIGEST_TEXT 可能含业务表名/字面量，导出前必须脱敏。
SELECT DIGEST,
       LEFT(DIGEST_TEXT, 200) AS digest_template,
       COUNT_STAR AS executions,
       ROUND(AVG_TIMER_WAIT / 1000000000000, 3) AS avg_latency_ms,
       ROUND(MAX_TIMER_WAIT / 1000000000000, 3) AS max_latency_ms,
       ROUND(SUM_TIMER_WAIT / 1000000000000, 3) AS total_latency_ms,
       SUM_ROWS_EXAMINED AS rows_examined,
       SUM_ROWS_SENT AS rows_sent,
       SUM_NO_INDEX_USED AS no_index_used_count
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;

-- M04：锁等待链；需要 performance_schema/data lock instrumentation 权限。
SELECT REQUESTING_ENGINE,
       REQUESTING_ENGINE_TRANSACTION_ID AS waiting_transaction_id,
       BLOCKING_ENGINE,
       BLOCKING_ENGINE_TRANSACTION_ID AS blocking_transaction_id,
       REQUESTING_THREAD_ID,
       BLOCKING_THREAD_ID
FROM performance_schema.data_lock_waits
LIMIT 100;

-- 可选：把等待事务与锁对象关联；先检查 data_locks 的采样成本。
SELECT l.OBJECT_SCHEMA,
       l.OBJECT_NAME,
       l.LOCK_TYPE,
       l.LOCK_MODE,
       l.LOCK_STATUS,
       LEFT(l.LOCK_DATA, 80) AS lock_data_prefix
FROM performance_schema.data_lock_waits AS w
JOIN performance_schema.data_locks AS l
  ON l.ENGINE = w.REQUESTING_ENGINE
 AND l.ENGINE_TRANSACTION_ID = w.REQUESTING_ENGINE_TRANSACTION_ID
 AND l.THREAD_ID = w.REQUESTING_THREAD_ID
LIMIT 100;

-- M05：复制健康。SHOW 输出含敏感源连接信息，只保留白名单字段后再入证据板。
SHOW REPLICA STATUS;

-- M06：估计计划，不执行 SELECT。
EXPLAIN FORMAT=TREE
SELECT id, status
FROM synthetic_orders
WHERE tenant_id = 42
  AND created_at >= '2026-11-24 00:00:00'
ORDER BY created_at DESC
LIMIT 100;

-- 仅在隔离测试副本、成本审批和超时确认后，由 DBA 取消注释。
-- EXPLAIN ANALYZE 会真正执行 SELECT；LIMIT 不保证内部不做完整扫描。
-- EXPLAIN ANALYZE
-- SELECT id, status FROM synthetic_orders
-- WHERE tenant_id = 42 AND created_at >= '2026-11-24 00:00:00'
-- ORDER BY created_at DESC LIMIT 100;

COMMIT;

-- 审计：保存实际会话设置、原始查询、参数、时间范围、行数、结果 SHA-256、TTL 与实例版本。
-- 本文件不含 DDL/DML/kill/failover/restore；这些动作只能走 DBA 变更与恢复演练门禁。
