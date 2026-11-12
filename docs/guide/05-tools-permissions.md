---
title: 工具、权限与安全护栏
description: 从只读到自治的动作阶梯、权限模型、前后置护栏、审批包与安全失败模式。
---

# 05 工具、权限与安全护栏

> 运维 Agent 的能力边界，最终由工具和权限决定。模型只是决定“想做什么”，工具契约与策略决定“能做什么”。

## 动作阶梯

| 等级 | 名称 | Agent 能做什么 | 人类角色 | 适用条件 |
| --- | --- | --- | --- | --- |
| **L0** | 只读 | 查询、检索、解释 | 提问者 | 默认起点 |
| **L1** | 建议 | 给诊断、方案、影响面 | 决策者 | 有证据与评测 |
| **L2** | 预演 | dry-run、diff、回滚计划 | 审批者 | 工具有 dry-run |
| **L3** | 受控执行 | 小范围变更，需审批 | 审批 + 观察 | 有回滚与灰度 |
| **L4** | 有界自治 | 策略内自动修复 | 监控 + 熔断 | 评测、审计、回滚成熟 |
| **L5** | 跨域自治 | 多系统协同自动闭环 | 治理 | 极少数场景 |

不要跳级。绝大多数团队在第一年只需要 L1–L3。

## 权限模型

一个可用的权限判断至少包含七个维度：

```text
principal × tool × resource scope × environment × time × blast radius × approval
```

| 维度 | 示例 |
| --- | --- |
| Principal | Agent 服务身份、调用者、审批者 |
| Tool | `k8s.get_pod`、`k8s.restart_deployment`、`rdma.set_pfc` |
| Resource scope | 单 namespace / 单集群 / 单租户 / 单机架 |
| Environment | dev / staging / prod / dr |
| Time | 变更窗口、维护模式、冻结期 |
| Blast radius | 最多影响 1 个实例 / 1 个节点 / 1 个集群 |
| Approval | 自动 / 单人 / 双人 / 变更委员会 |

::: warning 最小权限不是“只读”
最小权限是“完成当前任务所需的最小写权限 + 最短时间 + 最小范围”。只读是 L0 的最小权限，不是所有场景的终点。
:::

## 前后置护栏

### 前置检查

- 证据是否完整：目标存在、环境正确、时间窗口正确。
- 变更窗口是否允许，是否处于冻结期/事故模式。
- 依赖是否健康，是否有正在进行的变更。
- 备份/快照/回滚点是否就绪。
- blast radius 是否在阈值内。
- 是否有 PDB、维护模式、流量摘除等保护。

### 运行时护栏

- 速率限制、并发限制、重试上限、超时。
- 幂等键与去重，防止重复执行。
- 循环检测：同一工具/同一参数反复调用时熔断。
- kill switch：人工或策略一键停止。
- 凭证最小化：短时令牌、按工具授权、不进入 Prompt。

### 后置验证

- 健康检查、就绪检查、SLO、错误率、延迟。
- 日志与事件是否出现新的异常。
- 变更 diff 是否与计划一致。
- 回滚条件是否触发；回滚是否成功。
- 用户路径/业务指标是否恢复。

## 审批包

人类审批者不应该只看一句“是否允许”。审批包至少包含：

| 内容 | 说明 |
| --- | --- |
| 变更内容 | 要做什么，工具与参数 |
| 证据 | 为什么做，支持证据与反证 |
| 影响面 | 资源、租户、地域、预估 blast radius |
| Diff | 变更前后的配置/资源差异 |
| 风险 | 最坏情况、失败概率、依赖风险 |
| 回滚 | 回滚步骤、预估时间、验证方法 |
| 有效期 | 审批在多长时间内有效 |
| 审批人 | 谁有权批准，是否需要双人 |

审批疲劳是真实风险。按风险分级：低风险自动放行、中风险单人、较高风险双人、高风险变更委员会。不要把一切都变成“点一下同意”。

## 沙箱、预演与灰度

| 手段 | 回答的问题 | 局限 |
| --- | --- | --- |
| Dry-run | 计划是否可执行、diff 是什么 | 不能证明真实效果 |
| 沙箱 | 在隔离环境能否跑通 | 与生产状态可能不一致 |
| 历史回放 | 在过去的事故上是否正确 | 无法覆盖新故障 |
| 影子模式 | 在真实流量下建议是否靠谱 | 不执行，验证有限 |
| 灰度 | 小范围真实执行是否安全 | 需要可观测与回滚 |
| 混沌演练 | 失败路径是否可控 | 成本高，需安全边界 |

## 安全风险

### Prompt Injection

外部内容（日志、工单、网页、告警文本）可能包含恶意指令。原则：

- 外部内容一律视为不可信数据，不当作指令。
- 工具调用使用 allowlist，不接受模型自由生成的高危命令。
- 变更参数必须来自结构化工具 schema，不从自然语言直接拼接 shell。
- 对敏感操作做二次确认与策略校验。

### 凭证与数据

- 凭证不进入 Prompt、不进入日志、不进入沙箱明文环境。
- 使用短时凭证、按工具授权、最小权限角色。
- 日志与 Trace 脱敏；跨租户数据隔离。
- 数据出境/驻留遵守合规要求。

### 审计

每次运行至少记录：谁发起、Agent 做了什么、证据是什么、谁批准、执行结果、是否回滚。审计日志应 append-only、可检索、可导出。

## 失败模式

| 失败模式 | 表现 | 对策 |
| --- | --- | --- |
| 过度授权 | Agent 能删生产资源 | 按工具/范围/时间收紧 |
| 幻觉资源 ID | 操作了不存在的资源或错误实例 | 先查询确认，参数来自工具结果 |
| 不可逆动作 | 删除 PVC、强制删除、改安全策略 | 默认禁止，白名单 + 双人审批 |
| 上下文过期 | 基于旧拓扑/旧配置决策 | 证据带 TTL，动作前重新确认 |
| 工具错误循环 | 反复重试同一个失败调用 | 重试上限、熔断、升级 |
| 审批疲劳 | 所有动作都让人点同意 | 风险分级、批量低风险审批 |
| 静默失败 | 执行成功但业务未恢复 | 强制后置验证与 SLO 检查 |

## 一个工具契约的骨架

```yaml
name: k8s.restart_deployment
description: 在指定 namespace 内触发 Deployment 滚动重启
side_effects: true
idempotent: true
dry_run: true
scope:
  resource: deployment
  environment: [staging, prod]
  max_blast_radius: 1
permissions:
  role: ops-agent-operator
  approval: single
input_schema:
  cluster: string
  namespace: string
  name: string
output_schema:
  previous_revision: string
  new_revision: string
  rollout_status: string
rollback:
  tool: k8s.rollout_undo
  window_minutes: 15
audit:
  fields: [caller, agent_run_id, approval_id, cluster, namespace, name]
```

完整模板见[工具契约](../templates/tool-contract)。

## 贯穿案例：节点 drain 的契约与权限

以第 02 章的 NotReady 节点为例。drain 是高风险动作，契约必须写清楚 PDB、范围、审批、回滚和验证：

```yaml
name: k8s.drain_node
description: 在 PDB 允许的前提下 cordon 并 drain 单个节点
side_effects: true
idempotent: true
dry_run: true
reversible: true
scope:
  resource_types: [node]
  environments: [prod]
  max_blast_radius: 1
permissions:
  approval: dual
  change_window: required
input_schema:
  required: [cluster, node]
  properties:
    cluster: { type: string }
    node: { type: string }
    ignore_daemonsets: { type: boolean, default: true }
output_schema:
  properties:
    evicted_pods: { type: integer }
    pdb_violations: { type: integer }
    cordoned: { type: boolean }
execution:
  timeout_seconds: 900
  rate_limit: "2/hour"
rollback:
  tool: k8s.uncordon
  window_minutes: 10
verification:
  - node_ready
  - pdb_satisfied
  - slo_recovered
```

审批人至少看到：节点与节点池、当前 NotReady 证据、待驱逐 Pod 与 PDB、预计影响面、清理/恢复步骤、回滚与验证。没有 PDB 检查或回滚工具时，不允许注册这个工具。案例的完整走查见[附录：K8s 节点 NotReady 端到端案例](../appendix/case-notready)。

## 本章检查清单

- [ ] Agent 当前处于动作阶梯的哪一级？是否有人批准升级？
- [ ] 权限是否按工具、资源、环境、时间、blast radius 收紧？
- [ ] 每个变更工具是否有 dry-run、幂等、回滚与审计？
- [ ] 是否有前置检查、运行时护栏与后置验证？
- [ ] 审批包是否包含证据、影响面、diff、风险与回滚？
- [ ] 是否有 kill switch、只读降级与人工接管？
- [ ] 外部内容是否被当作不可信数据？凭证是否隔离？

下一章：[上下文与知识工程](./06-context-knowledge)
