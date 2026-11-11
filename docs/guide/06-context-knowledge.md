---
title: 上下文与知识工程
description: 运维 Agent 的证据包、Runbook 2.0、拓扑/CMDB、新鲜度、检索与反模式。
---

# 06 上下文与知识工程

> 运维 Agent 的答案质量，八成取决于它看到了什么，而不是它有多会推理。

## 五层上下文

| 层 | 内容 | 典型来源 | 新鲜度 |
| --- | --- | --- | --- |
| **事实** | 指标、日志、链路、事件、配置 | Prometheus、SLS、Tracing、K8s API | 秒–分钟 |
| **结构** | 服务目录、拓扑、依赖、负责人 | CMDB、K8s、服务网格、网络拓扑 | 小时–天 |
| **历史** | 变更、事故、工单、发布 | GitOps、ITSM、事故库 | 天–年 |
| **知识** | Runbook、SOP、厂商文档、设计文档 | Wiki、Git、知识库 | 版本化 |
| **约束** | 变更窗口、合规、维护模式、策略 | 变更系统、策略引擎 | 实时 |

缺少任何一层，判断都会变形：

- 只有事实没有结构：知道 CPU 高，不知道影响谁。
- 只有结构没有历史：不知道最近改了什么。
- 只有知识没有事实：给出“通用正确、现场错误”的建议。
- 没有约束：方案在技术上可行，在流程上不可执行。

## 证据包

每次诊断都应该产出结构化证据包，而不是一段自然语言总结。

```json
{
  "run_id": "run-2026-11-10-001",
  "environment": "prod-us-east",
  "scope": {"cluster": "prod-us-east-1", "namespace": "payments"},
  "observations": [
    {
      "source": "k8s.events",
      "query": "namespace=payments reason=BackOff",
      "time_range": "2026-11-10T10:00:00Z/2026-11-10T10:15:00Z",
      "summary": "pod payments-api-7d9f CrashLoopBackOff, restart count 14",
      "confidence": 0.95,
      "provenance": "https://.../query/..."
    }
  ],
  "hypotheses": [
    {"cause": "missing DATABASE_URL", "support": ["event:CreateContainerConfigError"], "confidence": 0.8},
    {"cause": "OOMKilled", "support": [], "contradict": ["lastState.terminated.reason=Error"], "confidence": 0.1}
  ],
  "gaps": ["no recent deployment diff for this namespace"]
}
```

证据包的价值：

- 可复核：人和另一个 Agent 都能重放查询。
- 可评测：评测不只看答案，还看证据是否支持结论。
- 可审计：事故复盘能还原当时的判断依据。
- 可迁移：换模型/换平台，证据格式不变。

## Runbook 2.0

传统 Runbook 是写给人看的散文；运维 Agent 需要**可执行、可验证、可回滚**的 Runbook。

```yaml
id: k8s-crashloop-triage
version: 3
scope:
  resource: deployment
  environment: prod
preconditions:
  - target_exists
  - evidence_fresh_within: 10m
steps:
  - id: check_events
    tool: k8s.get_events
    params: {namespace: "${namespace}", involved_object: "${pod}"}
    expect: "event reason in [BackOff, Failed, Unhealthy]"
  - id: check_logs
    tool: logs.query
    params: {service: "${service}", since: "15m", level: "error"}
  - id: check_resources
    tool: k8s.get_pod
    params: {namespace: "${namespace}", name: "${pod}"}
    expect: "resources.requests and limits present"
verification:
  - tool: k8s.rollout_status
    params: {namespace: "${namespace}", name: "${deployment}"}
rollback:
  - tool: k8s.rollout_undo
    params: {namespace: "${namespace}", name: "${deployment}"}
escalation:
  - when: "evidence_gap or confidence < 0.6"
    to: "payments-oncall"
```

Runbook 2.0 的关键不是格式，而是把**前置条件、证据、验证、回滚、升级**写进同一份可执行资产。

## 拓扑与 CMDB

运维 Agent 必须能回答“这个资源属于谁、依赖谁、被谁依赖、在哪个环境、最近改过什么”。

最低要求：

- 资源 ID 稳定，避免用 IP/名称作为唯一标识。
- 服务 → 实例 → 节点 → 网络/存储/GPU 的关系可查询。
- 负责人、值班、SLO、环境标签齐全。
- 变更历史与部署版本可关联。
- 拓扑有 TTL，过期自动刷新或标记。

## 新鲜度与来源

每条上下文都要能回答：

- 什么时候采集的？
- 查询条件是什么？
- 来自哪个环境、哪个账号、哪个集群？
- 是否有采样/聚合/截断？
- 数据是否完整，缺失了什么？

::: danger 过期上下文比没有上下文更危险
基于旧拓扑把流量切到已经下线的节点，比“我不知道”更糟。动作前必须重新确认关键事实。
:::

## 检索设计

- 先结构化查询，再语义检索；能精确查的不要用向量搜。
- 检索结果带来源、时间、版本、权限标签。
- 对长文档做分层摘要，但保留可展开的原文引用。
- 对日志/事件做聚合与去重，不要把几万行原始日志塞进上下文。
- 多源证据冲突时，明确列出冲突，不要强行统一。

## 检索评测

| 指标 | 问题 |
| --- | --- |
| Recall | 该找到的 Runbook/事故/文档找到了吗？ |
| Precision | 找到的内容有多少是相关的？ |
| Citation accuracy | 引用是否真的支持结论？ |
| Freshness | 是否使用了过期文档/拓扑？ |
| Coverage | 关键场景是否有可检索的知识？ |

## 六个反模式

1. **把所有日志塞进上下文**：成本高、噪声大、关键证据被淹没。
2. **没有时间戳**：无法判断是当前状态还是历史状态。
3. **没有来源**：无法复核，无法追责。
4. **Runbook 只写“怎么做”**：没有前置条件、验证和回滚。
5. **知识库没有 owner**：文档过期无人维护。
6. **把外部内容当指令**：日志/工单里的恶意文本可能诱导 Agent。

## 本章检查清单

- [ ] 是否有事实、结构、历史、知识、约束五层上下文？
- [ ] 每次诊断是否产出结构化证据包？
- [ ] 关键 Runbook 是否可执行、可验证、可回滚？
- [ ] 拓扑/CMDB 是否有 TTL、owner 和变更历史？
- [ ] 证据是否带来源、时间、环境和置信度？
- [ ] 是否评测检索的召回、精度与引用准确率？

下一章：[评测、验收与发布](./07-evaluation-release)
