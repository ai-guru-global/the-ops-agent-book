# NotReady Agent 参考实现

纯 Node.js 22+ ESM、零第三方运行时依赖的合成运维 Agent。它读取仓库中的 NotReady 权限策略，在内存 K8s 状态上演示只读诊断、受控写入、审批、撤销、审计、影子运行、单节点灰度和 kill switch 回滚。

> **不能用于生产。** 所有租户、节点、日志、身份、审批人和状态均为 synthetic/desensitized 数据。本实现不连接网络、真实 Kubernetes、密钥服务、模型服务或撤销流，不执行真实 shell/Kubernetes 命令。事件与外部锚点使用固定的 synthetic 演示密钥，保证回归可重复；这些密钥不是秘密，生产必须改用 KMS/HSM、独立锚点服务、可信时间和密钥轮换/撤销。

## 运行

```bash
cd examples/reference-agent
npm test
node runner.mjs demo --output sample-output/demo
node runner.mjs shadow --output sample-output/shadow
node runner.mjs canary --output sample-output/canary
node runner.mjs rollback --output sample-output/rollback
```

也可以使用 `npm run demo|shadow|canary|rollback`。每次 CLI 运行生成：

- `summary.json`：结果、计划版本、审批绑定、步骤、检查、最终状态、调用计数和 Trace/锚点头哈希。
- `trace.jsonl`：符合 `schemas/agent-event.schema.json` v1.1.0 的 append-only 导出；每个事件包含 SHA-256 链哈希、HMAC-SHA256 签名和可信时间信封。
- `anchor.json`：使用独立 synthetic 密钥签名的外部链头承诺，绑定 `chain_id/event_count/head_hash/anchored_at/previous_anchor_hash`。

退出码：成功或已回滚为 `0`，失败/升级为 `1`，参数错误为 `2`。

## 模块

| 文件 | 职责 |
| --- | --- |
| `src/policy-engine.mjs` | 严格按策略 `decision_order` 执行身份/委托、显式 deny、凭证/撤销、工具契约、角色/环境/资源、窗口/爆炸半径、审批绑定、前置条件和写前重校验。 |
| `src/approval-service.mjs` | 不可变计划快照、canonical JSON SHA-256、`plan_version`、`target_resource_versions`、到期时间、双人/单人批准、拒绝和撤销。完整计划任一字段变化均使旧审批失效。 |
| `src/credential-service.mjs` | 带 `iss/sub/aud/exp/nbf/jti/tenant/purpose/act/delegation/scope` 的 HMAC-SHA256 短期 token；校验签名、受众、时间、scope 和撤销；委托不可传递。 |
| `src/event-store.mjs` | Canonical Event v1.1.0、单调 sequence、parent/causation、SHA-256 哈希链、HMAC 验签、可信时间、独立外部锚点、JSONL 导出和验链。 |
| `src/tool-gateway.mjs` | 合成集群、短别名到策略契约名映射、dry-run、幂等键、部分成功闩锁、未知结果对账闩锁、调用前策略检查和审计。 |
| `src/runtime.mjs` | 四种场景编排、稳定导出接口和输出。 |
| `src/shared.mjs` | canonical JSON、哈希、不可变克隆、合成标识和 selector 匹配。 |

工具短别名映射为：`read_node → k8s.read_node`、`read_pdb → k8s.check_pdb`、`drain_node → k8s.drain_node`、`cleanup_logs → node.cleanup_logs`、`uncordon_node → k8s.uncordon`。网关只允许策略中登记的契约版本。

## 场景语义

### demo

1. Copilot 只读诊断节点和 PDB，保存证据并冻结计划 v1。
2. 两名不同的人类审批者批准完整计划哈希；Operator 在 drain 前重新验证审批、token、撤销、窗口、PDB 和目标版本。
3. drain 单节点；cleanup 三个合成日志目标成功 2/3。
4. 部分成功设置安全闩锁。即使新的 v2 审批已经存在，后续写仍被拒绝；显式 `resumeAfterReplan` 后才继续。
5. v2 + 新双人审批完成剩余清理。合成控制器随后恢复 Ready，并验证 Ready/PDB/容量/SLO。
6. 冻结 v3、单人批准后 uncordon。uncordon 只恢复可调度性，不宣称撤销日志删除或 Pod 迁移。

### shadow

只挂载 `read_node/read_pdb`。drain、cleanup、uncordon 仅记录 `would_do`，不要求写凭证或执行策略写路径，合成状态逐字段保持不变。

### canary

在同一个合成集群中只允许一个指定节点发生写副作用；其他节点写入在网关层拒绝，并检查 PDB 未破坏。

### rollback

先执行一次获批合成 drain，再触发 kill switch、撤销 Operator token、阻止后续自动写、恢复 LKG 快照，最后仅验证只读诊断仍可用。不会在 kill switch 后用 uncordon 写操作“恢复”。

## 稳定接口

根级评测器可导入：

```js
import {
  createRuntime,
  runNotReadyScenario,
  runShadow,
  runCanary,
  runRollback,
} from './examples/reference-agent/src/index.mjs';
```

四个 `run*` 函数接受可选 `{ outputDir, now, node, clusterName, failedLogId }`。返回对象包含：

- `success`、`summary`、`trace`（同时提供 `events` 别名）、`anchor`、`trace_jsonl`、`final_state`、`audit`。
- `summary.outcome`、`verified`、`plan_versions`、`approvals`、`steps`、`checks`、`counts`、`trace`。
- 传入 `outputDir` 时同时写盘；也可直接调用 `writeRunOutput(result, outputDir)`。

`createRuntime()` 返回运行时实例，可访问 `policyEngine`、`approvalService`、`credentialService`、`eventStore`、`gateway`、`cluster`，用于故障注入和细粒度测试。默认时钟固定为 `2026-11-24T00:00:00.000Z`，保证样例可重复；token 和事件 ID 不包含真实身份信息。

## 安全边界与未覆盖项

- 这是策略执行点和工具网关的教学参考，不是 MCP/OpenAPI 服务器，也不是完整生产身份平台。
- canonical JSON 实现覆盖本项目的 JSON 值类型，不声称完整实现 RFC 8785 数值规范化。
- 撤销、审批人和 change window 都是进程内合成输入；生产实现必须接入持久化、加密、原子 CAS、实时撤销传播、限流、租户隔离、秘密管理和独立审计存储。
- 事件签名与锚点只证明持有对应 synthetic 密钥者未篡改；生产必须分离事件签名密钥与外部锚点密钥，支持 `key_id` 轮换/撤销、可信时间、锚点连续性监控和 WORM 权限隔离。
- 未知结果必须使用相同幂等键取得缓存结果，并通过 `reconcile()` 对账；禁止换新键盲目重试。
- 测试只使用 `node:test` 与 Node 内置模块，不需要安装依赖。
