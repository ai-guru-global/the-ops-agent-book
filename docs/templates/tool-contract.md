---
title: 工具契约
description: 运维 Agent 工具契约模板：输入输出、副作用、幂等、dry-run、权限、审批、回滚与审计。
---

# 工具契约模板

> 工具契约是 Agent 与生产系统之间的合同。没有契约，Agent 只能“猜”工具能做什么。

## 完整模板

```yaml
name: <namespace.tool_name>
version: 1.0.0
description: <一句话说明工具做什么、什么时候用、什么时候不要用>

# 能力与副作用
side_effects: false          # 是否改变系统状态
idempotent: true             # 重复调用是否安全
dry_run: true                # 是否支持预演
reversible: true             # 是否可回滚
scope:
  resource_types: [deployment]
  environments: [staging, prod]
  max_blast_radius: 1        # 最多影响多少资源
  required_labels: []

# 权限与审批
permissions:
  role: ops-agent-operator
  approval: single           # none / single / dual / cab
  change_window: required
  break_glass: false

# 输入/输出
input_schema:
  type: object
  required: [cluster, namespace, name]
  properties:
    cluster: { type: string }
    namespace: { type: string }
    name: { type: string }
    reason: { type: string }
output_schema:
  type: object
  properties:
    accepted: { type: boolean }
    previous_state: { type: object }
    new_state: { type: object }
    rollback_token: { type: string }

# 执行约束
execution:
  timeout_seconds: 300
  rate_limit: "10/min"
  concurrency_limit: 1
  retry:
    max_attempts: 2
    backoff: exponential
  error_taxonomy:
    - retryable
    - auth
    - validation
    - conflict
    - unknown

# 安全
security:
  credentials: short_lived
  secret_handling: never_log
  input_validation: strict
  injection_protection: true

# 回滚
rollback:
  tool: <namespace.rollback_tool>
  window_minutes: 15
  verification: <namespace.verify_tool>

# 审计
audit:
  fields: [caller, agent_run_id, approval_id, cluster, namespace, name, reason]
  retention_days: 365

# 观测
observability:
  trace: true
  metrics: [latency, error_rate, calls]
  log_fields: [input_hash, output_hash, approval_id]
```

## 契约测试

每个写工具至少测试：

- 正常参数成功。
- 缺少必填参数失败。
- 资源不存在失败，且不产生副作用。
- 越权 scope 被拒绝。
- dry-run 不产生副作用。
- 重复调用幂等。
- 回滚可用。
- 审计字段完整。

## 一个例子：K8s 重启 Deployment

```yaml
name: k8s.restart_deployment
version: 1.2.0
description: 在指定 namespace 内触发 Deployment 滚动重启；不删除资源。
side_effects: true
idempotent: true
dry_run: true
reversible: true
scope:
  resource_types: [deployment]
  environments: [staging, prod]
  max_blast_radius: 1
permissions:
  role: ops-agent-operator
  approval: single
  change_window: required
input_schema:
  required: [cluster, namespace, name]
output_schema:
  properties:
    previous_revision: { type: string }
    new_revision: { type: string }
    rollout_status: { type: string }
execution:
  timeout_seconds: 300
  rate_limit: "10/min"
rollback:
  tool: k8s.rollout_undo
  window_minutes: 15
audit:
  fields: [caller, agent_run_id, approval_id, cluster, namespace, name]
```

## 贯穿案例：K8s 节点 drain

以[附录案例](../appendix/case-notready)中的 NotReady 节点为例，drain 契约要把 PDB、审批、回滚与验证写全：

```yaml
name: k8s.drain_node
version: 1.0.0
description: 在 PDB 允许的前提下 cordon 并 drain 单个节点；不做批量操作
side_effects: true
idempotent: true
dry_run: true
reversible: true
scope:
  resource_types: [node]
  environments: [prod]
  max_blast_radius: 1
  required_labels: [managed-by=platform]
permissions:
  role: ops-agent-senior-operator
  approval: dual
  change_window: required
  break_glass: false
input_schema:
  type: object
  required: [cluster, node]
  properties:
    cluster: { type: string }
    node: { type: string }
    ignore_daemonsets: { type: boolean, default: true }
    reason: { type: string }
output_schema:
  type: object
  properties:
    cordoned: { type: boolean }
    evicted_pods: { type: integer }
    pdb_violations: { type: integer }
    rollback_token: { type: string }
execution:
  timeout_seconds: 900
  rate_limit: "2/hour"
  concurrency_limit: 1
  retry:
    max_attempts: 1
    backoff: none
  error_taxonomy: [retryable, auth, validation, conflict, pdb_blocked, unknown]
security:
  credentials: short_lived
  secret_handling: never_log
  input_validation: strict
preconditions:
  - node_exists
  - node_not_ready
  - pdb_check_passed
  - no_active_incident_in_scope
rollback:
  tool: k8s.uncordon
  window_minutes: 10
  verification: k8s.node_ready
audit:
  fields: [caller, agent_run_id, approval_id, cluster, node, reason]
  retention_days: 365
```

没有 PDB 前置检查、回滚工具或双人审批时，不应注册这个工具。

## 常见错误

- 只写“输入/输出”，不写副作用与回滚。
- 不写 blast radius，导致一次调用影响整个集群。
- 不写 dry-run，审批者无法预演。
- 不写错误分类，Agent 对 auth/validation 错误盲目重试。
- 不写审计字段，事故复盘无法还原。

## 检查清单

- [ ] 描述清楚“什么时候用/什么时候不要用”。
- [ ] 副作用、幂等、dry-run、可逆性明确。
- [ ] scope、blast radius、环境限制明确。
- [ ] 权限、审批、变更窗口明确。
- [ ] 输入/输出 schema 严格。
- [ ] 超时、速率、并发、重试、错误分类明确。
- [ ] 凭证与敏感数据处理明确。
- [ ] 回滚工具与验证工具明确。
- [ ] 审计字段完整。
- [ ] 契约测试覆盖正常/异常/越权/幂等/回滚。
