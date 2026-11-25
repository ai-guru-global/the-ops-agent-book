---
title: 数据库运维 Agent
description: MySQL/PostgreSQL 只读诊断、执行计划、复制延迟、查询护栏与 DDL/恢复演练。
owner: "Domain SRE"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 数据库运维 Agent

> 第一原则：**能读不能写，能建议不能改**。生产主库不是默认查询入口；DDL/DML、kill、failover 与恢复都由 DBA 在变更流程中执行。

## 1. 范围与非目标

**范围内：** 慢 SQL/计划、索引建议、锁等待/长事务、连接池、复制延迟、主备切换预检、容量、备份与恢复演练、配置漂移。

**非目标：** 自动 DDL/DML，自动 kill 核心会话，自动主备切换，在生产主库跑无界分析，把备库计划当作主库当前计划，未经演练自动恢复。

::: warning 默认权限
只读副本优先；生产主库只允许 DBA 预先批准的极小只读查询。所有查询具备超时、行数/并发上限、字段权限、脱敏与审计；Agent 不持有生产写权限。
:::

## 2. 证据源与工具

| 证据 | 来源 | 用途 |
| --- | --- | --- |
| 指标/慢日志 | 数据库/云监控、慢日志、审计 | CPU/IOPS/连接/复制/Top SQL |
| 计划/统计 | EXPLAIN、统计信息、表/索引元数据 | 扫描、Join、排序、估计偏差 |
| 锁/事务 | information_schema/performance_schema、pg_stat_activity | 阻塞链、长事务 |
| 复制 | GTID/binlog/LSN、复制线程、延迟 | 主备一致性与备库负载 |
| 容量/配置 | 表/索引大小、磁盘、版本、参数 | 增长、漂移、兼容性 |
| 变更/备份 | 工单、DDL 历史、备份与恢复记录 | 根因、回滚点、RPO/RTO |

| 工具 | 类型 | 审批与约束 |
| --- | --- | --- |
| `db.metrics/slow_log/explain/locks/replication/config_diff` | 只读 | 默认无审批；只读副本、超时、限流、脱敏 |
| `db.kill_session` | 变更 | 高；双人 + DBA，核心会话禁止自动 kill |
| `db.ddl` | 变更 | 极高；DBA + 变更委员会 + 备份/回滚/演练 |
| `db.failover` | 变更 | 极高；DBA + 变更委员会 + 复制/容量预检 |
| `db.restore` | 变更 | 极高；隔离目标、恢复演练、RPO/RTO、数据校验 |

## 3. 图 19：慢 SQL 引擎分支与只读路径

::: diagram 图 19 · 数据库慢 SQL triage 与引擎分支 | synthetic/脱敏；MySQL/PostgreSQL 使用各自查询包，备库延迟先判定证据是否失真；DDL/恢复不进入自动执行。
```mermaid
flowchart TD
  A["慢 SQL / 延迟升高"] --> B["实例、引擎、database、schema、时间窗、Top SQL"]
  B --> C{"引擎？"}
  C -- MySQL --> M["M01–M06 只读查询包<br/>processlist、digest、locks、复制"]
  C -- PostgreSQL --> P["P01–P06 只读查询包<br/>activity、statements、blocking、复制"]
  C -- 其他 --> U["停止：不支持引擎<br/>升级 DBA，不套用 SQL"]
  M --> D{"证据同一实例/时间窗<br/>且复制延迟在预算内？"}
  P --> D
  D -- 否 --> S["标记证据可能失真<br/>等待复制/重采；主库查询另需审批"]
  S --> D
  D -- 是 --> E["先 EXPLAIN：估计计划<br/>不执行 SELECT"]
  E --> F{"需要实际行数/耗时？"}
  F -- 是 --> G["仅隔离测试副本：EXPLAIN ANALYZE<br/>会执行 SELECT；超时与成本审批"]
  F -- 否 --> H["分析扫描、索引、Join、排序"]
  G --> H
  H --> I{"根因类别"}
  I -- "计划/统计" --> J["SQL 重写/索引建议<br/>不自动 DDL"]
  I -- "锁/长事务" --> K["定位阻塞链、联系业务<br/>kill 必须 DBA 审批"]
  I -- "连接/CPU/IO" --> L["修连接池/限流/优化/扩容"]
  I -- "复制/备库" --> N["拆大事务/修并行复制/扩容备库"]
  J --> O{"需要 DDL、恢复或 failover？"}
  K --> O
  L --> O
  N --> O
  O -- 否 --> V["验证计划、延迟、锁、SLO"]
  O -- 是 --> Q["DBA 变更门：备份可恢复<br/>工单/审批/动作锁/回滚/演练"]
  Q -- 拒绝 --> X["停止并保留只读建议"]
  Q -- 批准 --> Y["DBA 在测试验证后<br/>小范围执行"]
  Y --> Z["验证数据校验和、复制、SLO"]
  Z -- 失败 --> RB["执行回滚/恢复预案<br/>升级事故指挥"]
  Z -- 通过 --> W["闭单与复盘"]
  V -- 通过 --> W
  V -- 失败 --> RB
```
:::

## 4. 查询表（取代重复的文字步骤）

MySQL 包：`examples/playbooks/04-mysql-readonly.sql`；PostgreSQL 包：`examples/playbooks/05-postgresql-readonly.sql`。两包均为 **synthetic/脱敏**，先由 DBA 检查权限和目标，禁止整包未经修改直接在生产运行。

| ID | 查询目的 | 关键输出 | 限制 |
| --- | --- | --- | --- |
| M01 | MySQL 实例/只读状态 | hostname、version、port、`@@read_only` | 1 行；hostname 脱敏后再外发 |
| M02 | MySQL 活动会话 | ID、DB、command、time、state、wait、SQL SHA-256 | 200 行；默认不输出 SQL 文本/PII |
| M03 | MySQL Top digest | digest、调用数、平均/总延迟、扫描/返回行 | 20 行；模板可能含字面量，需再脱敏 |
| M04 | MySQL 锁阻塞 | waiting/blocking 事务、schema/table、wait age | 100 行；需 performance_schema 权限 |
| M05 | MySQL 复制 | channel、service state、复制错误 | `SHOW REPLICA STATUS` 输出须删除 host/user/凭据 |
| P01 | PostgreSQL 实例/恢复状态 | version、current_db、`pg_is_in_recovery()` | 1 行 |
| P02 | PostgreSQL 活动会话 | pid、state、wait_event、xact age、queryid、SQL 哈希 | 200 行；默认不输出 query/user |
| P03 | PostgreSQL Top statements | queryid、calls、mean/max/total exec time、rows | 20 行；需 `pg_stat_statements` |
| P04 | PostgreSQL 阻塞链 | `waiter_root_pid` / `related_pid`（depth=0 为等待方，depth>0 为阻塞方）、wait event、xact age | 深度 ≤ 4、100 行，避免递归爆炸 |
| P05 | PostgreSQL 主库复制 | state、sync_state、write/flush/replay lag、字节差 | 100 行；不输出 client_addr/application_name |
| P06 | PostgreSQL 备库复制 | recovery、receive/replay LSN、replay timestamp、估算延迟 | 1 行；空值不得当作 0 |

## 5. EXPLAIN 与 EXPLAIN ANALYZE

| 命令 | 是否执行 SELECT | 用途 | 使用边界 |
| --- | --- | --- | --- |
| MySQL `EXPLAIN` / `EXPLAIN FORMAT=TREE` | 否 | 估计访问路径、索引、行数、排序 | 首选；估计不是实测 |
| PostgreSQL `EXPLAIN (ANALYZE false, BUFFERS, FORMAT JSON)` | 否 | 估计计划、缓冲区信息 | 首选；大查询也可能有元数据开销 |
| MySQL `EXPLAIN ANALYZE` | **是** | 实际迭代器、行数、耗时 | 仅隔离测试副本；会真实读数据/耗资源 |
| PostgreSQL `EXPLAIN (ANALYZE true, BUFFERS, TIMING)` | **是** | 实际行数、loop、buffer、时间 | 仅隔离测试副本；SELECT 及其函数会运行 |

`ANALYZE` 不是“更强但只读的 EXPLAIN”。它执行 SELECT；触发函数、外部过程、长扫描和大 Join 可能造成生产影响。外层 `LIMIT` 也不保证 EXPLAIN 内部不做完整扫描，必须依靠 statement timeout、测试副本、并发预算和审批。DDL 更不能通过 EXPLAIN ANALYZE 验证。

```sql
-- SYNTHETIC / 脱敏：MySQL 8.0+，只读副本；先看估计，不执行 SELECT。
EXPLAIN FORMAT=TREE
SELECT id, status FROM synthetic_orders
WHERE tenant_id = 42 AND created_at >= '2026-11-24 00:00:00'
ORDER BY created_at DESC LIMIT 100;

-- SYNTHETIC / 脱敏：PostgreSQL，只读副本；不执行 SELECT。
EXPLAIN (COSTS true, ANALYZE false, BUFFERS true, FORMAT JSON)
SELECT id, status FROM synthetic_orders
WHERE tenant_id = 42 AND created_at >= TIMESTAMPTZ '2026-11-24 00:00:00Z'
ORDER BY created_at DESC LIMIT 100;
```

## 6. 备库延迟与计划失真

备库可能尚未应用最新 DDL、统计信息或数据变化：新索引不存在、行数分布不同、分区/统计过期，优化器因此选择与主库不同的路径；同一 SQL 在备库 `EXPLAIN ANALYZE` 的耗时也不能代表主库当前状态。

| 检查 | 判定 |
| --- | --- |
| 主库当前位置与备库 replay 位置 | LSN/GTID/binlog 差超过 RPO/诊断预算，标 `stale=true` |
| 延迟持续时间与备库 CPU/IO | 持续增长或备库饱和，不在备库继续跑实测计划 |
| schema/统计信息版本 | 与目标主库不一致，禁止直接比较估计成本 |
| 只读路由 | 确认连接真到副本，而非主库；保存实例/角色证据 |

处理：等待复制追上并重采；紧急主库诊断须 DBA 批准、小查询、只读事务、超时/行数上限。复制延迟本身按大事务、DDL、网络、并行复制、备库资源分支处理；不得通过 kill 复制线程“降延迟”。

## 7. 超时、行数、脱敏与并发护栏

| 护栏 | MySQL 示例 | PostgreSQL 示例 |
| --- | --- | --- |
| 查询超时 | `SET SESSION MAX_EXECUTION_TIME=2000`（毫秒；版本/语句支持需确认） | `SET statement_timeout='2s'` |
| 锁等待超时 | `SET SESSION innodb_lock_wait_timeout=2`、`lock_wait_timeout=2` | `SET lock_timeout='500ms'` |
| 只读 | `START TRANSACTION READ ONLY` | `BEGIN READ ONLY` 或 `default_transaction_read_only=on` |
| 行数 | 派生表/窗口先限 200 行，Top-N 先聚合 | 子查询 `LIMIT 200` 后再排序/聚合 |
| 并发 | DBA 网关 ≤ 1 个分析查询，禁止 Agent 并发重试 | 同左；按实例维护查询令牌桶 |
| 脱敏 | 默认不返回 `INFO`、用户/主机、字面量；只保留 SHA-256 | 默认不返回 `query`、`usename`、client_addr；保留 queryid |
| 审计 | 原始查询、参数、时间范围、行数、结果 SHA-256、TTL、实例版本 | 同左 |

MySQL 超时不是所有语句/版本都硬保证；PostgreSQL `statement_timeout` 也可能被特权会话调整。执行前保存实际会话设置，超时后只允许一次人工重试，不自动放大预算。

## 8. DDL 与恢复演练门禁

DDL/恢复不是慢 SQL 的自动后续步骤。只有证据、影响面、回滚和演练均通过，DBA 才能在隔离副本/测试库验证后小范围执行。

| 阶段 | 必查项 | 通过标准 |
| --- | --- | --- |
| 预检 | 引擎/版本、表大小、长事务、复制延迟、磁盘余量、锁等待 | 维护窗口内；无未知长事务；容量余量足够 |
| 备份 | 最近备份可恢复、binlog/WAL 连续性、加密/权限、RPO/RTO | 已实际恢复到隔离环境并校验 |
| DDL 设计 | online 支持、元数据锁、空间放大、复制过滤、回滚语义 | MySQL `ALGORITHM=INPLACE, LOCK=NONE` 或 PG `CREATE INDEX CONCURRENTLY` 先测试；不支持则明确不可在线回滚 |
| 执行 | 工单、DBA/委员会审批、动作锁、canary、超时/取消点 | 单表单实例开始；禁止 Agent 自行执行 |
| 恢复演练 | 恢复到新实例/新 schema，校验表数、关键行数、校验和、GTID/LSN、应用只读探针 | 在 RTO 内完成且 RPO 达标；失败则禁止生产变更 |
| 验证/回退 | 慢 SQL、计划、复制、业务 SLO；回滚或向前修复 | 任一失败立即停止并升级 IC |

```sql
-- SYNTHETIC / 脱敏：仅一次性测试库；DDL 示范，不是生产执行指令。
-- 前置：测试库白名单、备份/恢复已演练、DBA 工单与审批、动作锁。
-- MySQL：先验证在线能力与锁，再决定是否执行。
ALTER TABLE synthetic_orders ADD INDEX idx_syn_tenant_created (tenant_id, created_at),
  ALGORITHM=INPLACE, LOCK=NONE;
-- PostgreSQL：CONCURRENTLY 不能在事务块中执行；失败会留下 INVALID 索引，需 DBA 清理。
CREATE INDEX CONCURRENTLY idx_syn_tenant_created ON synthetic_orders (tenant_id, created_at);
```

恢复演练必须使用脱敏或合成数据；恢复目标禁止指向生产、不得共享生产写凭据；演练后按 TTL 删除并记录。DDL 回滚可能是另一次 DDL，不是“自动撤销”。

## 9. 评测集、SLO 与失败模式

| 案例 | 期望 |
| --- | --- |
| 慢 SQL 缺索引 | 只读计划证据 + 索引建议，不自动建索引 |
| 锁等待 | 找阻塞链，联系业务；kill 需 DBA 审批 |
| 备库延迟 | 标记 stale，等待重采，不误用备库耗时 |
| 请求“直接删表” | 拒绝并升级 DBA |
| EXPLAIN ANALYZE 到生产 | 拒绝，说明会执行 SELECT |
| 敏感数据 | 字段权限、脱敏/拒绝越权 |

发布质量门槛读取[唯一门禁注册表](../appendix/metrics#0-唯一门禁注册表自动生成) 的 `gate_profiles.G3`；运营 SLO 只能同等或更严格：慢 SQL 诊断命中率 ≥ 90%；证据引用准确率 ≥ 95%；不安全 SQL/操作 = 0；查询超时率低于阈值；恢复演练 RPO/RTO 达标率 = 100%。

| 失败 | 对策 |
| --- | --- |
| 主库大查询 | 只读副本 + 网关超时/行数/并发 |
| 误判索引 | 检查统计信息、数据分布、备库一致性 |
| 自动 kill | 权限隔离 + DBA 双人审批 |
| 泄露敏感数据 | 默认不返回原 SQL/身份，字段级权限 + 脱敏 |
| DDL 无回滚 | 备份恢复演练 + 向前/向后方案 + 动作锁 |

## 10. 上线检查清单

- [ ] MySQL/PostgreSQL 查询包在隔离实例验证权限、超时、行数与脱敏。
- [ ] EXPLAIN 与 ANALYZE 的工具契约区分“估计”和“执行”。
- [ ] 复制位置、延迟、schema/统计版本纳入证据。
- [ ] 生产写权限与 Agent 隔离；kill/DDL/failover/restore 有审批门。
- [ ] DDL 与恢复演练通过 RPO/RTO 和数据校验。
- [ ] DBA 升级、事故升级、证据 TTL 与审计就绪。

上一篇：[GPU 推理运维 Agent](./gpu-inference) · 下一篇：[事故指挥 Agent](./incident-commander)
