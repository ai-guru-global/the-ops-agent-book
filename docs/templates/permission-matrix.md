---
title: 权限矩阵
description: 运维 Agent 的工具、环境、资源范围、审批与 blast radius 权限矩阵模板。
---

# 权限矩阵模板

> 权限矩阵是“Agent 能做什么”的权威答案。它应该独立于 Prompt，能被策略引擎执行，也能被审计。

## 矩阵模板

| 工具/动作 | 环境 | 资源范围 | 角色 | 审批 | Blast radius | Dry-run | 回滚 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `k8s.get_pod` | dev/staging/prod | namespace | viewer | 无 | 0 | N/A | N/A |
| `k8s.get_events` | dev/staging/prod | namespace | viewer | 无 | 0 | N/A | N/A |
| `logs.query` | dev/staging/prod | service | viewer | 无 | 0 | N/A | N/A |
| `k8s.restart_deployment` | staging | namespace | operator | 单人 | 1 deployment | 必须 | rollout undo |
| `k8s.restart_deployment` | prod | namespace | operator | 单人 + 窗口 | 1 deployment | 必须 | rollout undo |
| `k8s.scale` | prod | namespace | operator | 单人 + 窗口 | 1 workload | 必须 | 恢复副本 |
| `k8s.drain_node` | prod | node pool | senior | 双人 + 窗口 | 1 node | 必须 | uncordon |
| `cloud.replace_node` | prod | node pool | senior | 双人 + CAB | 1 node | 必须 | 回滚/替换 |
| `k8s.delete_namespace` | 任意 | 任意 | — | 禁止 | — | — | — |

## 权限规则

```text
allow if:
  role in allowed_roles
  and environment in allowed_environments
  and resource in allowed_scope
  and blast_radius <= max_blast_radius
  and (change_window_open or break_glass)
  and approval_satisfied
  and dry_run_passed (for write tools)
```

## 示例：三类角色

| 角色 | 能力 |
| --- | --- |
| Viewer Agent | 只读查询、诊断、生成报告 |
| Operator Agent | 在 staging 执行低风险变更；prod 需单人审批 |
| Senior Operator | prod 节点级变更；双人审批 + 窗口 |

## 评审与回收

- 每次新增工具/场景，更新矩阵并评审。
- 每季度复核一次权限，回收不再需要的 scope。
- Agent 退役时立即回收凭证与服务账号。
- 权限变更要可审计、可回滚。

## 检查清单

- [ ] 每个工具都有环境、资源范围、角色、审批、blast radius。
- [ ] 高危动作默认禁止或双人审批。
- [ ] 写工具必须 dry-run + 回滚。
- [ ] 策略引擎可执行矩阵，不依赖 Prompt。
- [ ] 变更窗口与 break-glass 流程明确。
- [ ] 定期复核与退役回收。
