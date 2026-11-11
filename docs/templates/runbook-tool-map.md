---
title: Runbook → Tool 映射
description: 把传统 Runbook 转成可执行、可验证、可回滚的机器可读 Runbook。
---

# Runbook → Tool 映射模板

> 传统 Runbook 是“写给人看的步骤”；Runbook 2.0 是“人和 Agent 都能执行、验证、回滚的资产”。

## 映射表

| 步骤 | 目的 | 证据 | 工具 | 输入 | 成功标准 | 失败处理 | 回滚 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 确认 Pod 状态 | events/status | `k8s.get_pod` | cluster/ns/pod | 状态与告警一致 | 升级 | N/A |
| 2 | 查容器日志 | 错误信息 | `logs.query` | service/since | 找到错误签名 | 扩大时间窗 | N/A |
| 3 | 查配置 | env/secret | `k8s.get_deployment` | ns/name | 配置存在 | 查 ConfigMap | N/A |
| 4 | 修复配置 | — | `gitops.commit` | repo/patch | 校验通过 | 人工审批 | revert |
| 5 | 验证 | rollout/SLO | `k8s.rollout_status` | ns/name | Ready 且 SLO 恢复 | rollout undo | 上一版本 |

## 机器可读 Runbook

```yaml
id: k8s-crashloop-triage
version: 3
owner: payments-sre
review_by: 2027-02-01
preconditions:
  - target_exists
  - evidence_fresh_within: 10m
steps:
  - id: get_pod
    tool: k8s.get_pod
    params: {cluster: "${cluster}", namespace: "${namespace}", name: "${pod}"}
  - id: get_events
    tool: k8s.get_events
    params: {namespace: "${namespace}", involved_object: "${pod}"}
  - id: get_logs
    tool: logs.query
    params: {service: "${service}", since: "15m"}
  - id: get_deployment
    tool: k8s.get_deployment
    params: {namespace: "${namespace}", name: "${deployment}"}
verification:
  - tool: k8s.rollout_status
    params: {namespace: "${namespace}", name: "${deployment}"}
  - tool: slo.query
    params: {service: "${service}", window: "15m"}
rollback:
  - tool: k8s.rollout_undo
    params: {namespace: "${namespace}", name: "${deployment}"}
escalation:
  - when: "confidence < 0.6 or evidence_gap"
    to: payments-oncall
```

## 转换原则

- 每个步骤都要有**目的、证据、工具、成功标准、失败处理**。
- 前置条件写清楚：目标存在、环境正确、证据新鲜。
- 变更步骤必须有回滚与验证。
- 升级条件写清楚：什么时候交给人。
- 所有参数来自结构化查询，不拼接 shell。

## 检查清单

- [ ] 每个步骤有工具与成功标准。
- [ ] 前置条件与证据新鲜度明确。
- [ ] 变更步骤有 dry-run/回滚/验证。
- [ ] 升级条件与接收人明确。
- [ ] Runbook 有 owner、版本、review_by。
- [ ] 新事故能沉淀回 Runbook。
