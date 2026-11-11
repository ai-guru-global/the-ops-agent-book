---
title: 事故指挥 Agent
description: 多 Agent 事故响应的角色、共享证据板、任务分派、沟通、护栏与复盘。
---

# 事故指挥 Agent

> 事故指挥 Agent 不是“自动修故障的超级 Agent”，而是让事故现场更有秩序：证据共享、任务分派、时间线、沟通与升级。

## 1. 范围与非目标

**范围内：**

- 事故时间线、证据板、任务板、决策日志。
- 多 Agent/多团队的诊断任务分派与汇总。
- 状态更新、影响面描述、对外沟通草稿。
- 升级提醒、超时提醒、待办跟踪。
- 复盘素材自动整理。

**非目标：**

- 替代人类 Incident Commander 做最终决策。
- 未经批准执行生产变更。
- 对外发布未经人审的沟通。
- 在事故中自动“猜测”根因并闭单。

## 2. 角色

| 角色 | 职责 | 人类/Agent |
| --- | --- | --- |
| Incident Commander | 最终决策、优先级、资源协调 | 人类 |
| Coordinator Agent | 维护时间线、任务板、证据板 | Agent |
| Diagnostician | 领域诊断（K8s/RDMA/GPU/DB） | Agent 或人 |
| Operator | 执行经批准的动作 | Agent 或人 |
| Communicator | 对内/对外沟通草稿 | Agent（人审） |
| Scribe | 记录决策、证据、待办 | Agent |

## 3. 共享证据板

事故期间，所有 Agent 和人看到同一块证据板：

```yaml
incident: INC-2026-11-10-001
severity: SEV-2
started_at: 2026-11-10T10:12:00Z
impact: "payments API 5xx 8%, P95 2.4s"
timeline:
  - at: 10:12
    event: "alert: payments-api 5xx"
    source: monitoring
  - at: 10:15
    event: "deploy v2.18.0 rolled out"
    source: gitops
evidence:
  - id: E-001
    source: k8s.events
    summary: "readiness probe failures on 3 pods"
    confidence: 0.9
tasks:
  - owner: diag-k8s
    task: "check readiness probe and rollout status"
    status: in_progress
decisions:
  - at: 10:20
    decision: "pause rollout"
    by: incident-commander
    evidence: [E-001]
```

## 4. 事故流程

```text
Detect → Declare → Assemble → Triage → Mitigate → Resolve → Review
```

| 阶段 | Coordinator Agent 做什么 |
| --- | --- |
| Detect | 汇总告警、影响面、初始证据 |
| Declare | 建议 Severity、拉群、通知值班 |
| Assemble | 创建证据板/任务板/时间线，分派诊断 |
| Triage | 汇总假设、冲突证据、待确认项 |
| Mitigate | 汇总方案、风险、回滚，等待批准 |
| Resolve | 验证恢复、记录影响、生成时间线 |
| Review | 整理复盘素材、待办、评测集更新 |

## 5. 沟通

- 对内：状态、影响、当前假设、下一步、需要谁。
- 对外：影响面、缓解措施、下次更新时间；必须人审。
- 更新节奏：SEV-1/2 每 15–30 分钟，SEV-3 每 60 分钟。
- 不承诺未经验证的恢复时间。

## 6. 多 Agent 护栏

- **单一仲裁者**：所有变更由 Incident Commander/Operator 统一协调，避免多个 Agent 同时动作。
- **证据优先**：冲突证据必须列出，不强行统一。
- **任务去重**：同一诊断任务不重复分派。
- **超时升级**：任务超时自动提醒/升级。
- **终止条件**：恢复验证通过 + 无新增高优待办。
- **审计**：每个决策记录证据、决策人、时间。

## 7. 评测

| 场景 | 期望 |
| --- | --- |
| 模拟 SEV-2 发布失败 | 快速建立时间线、分派、汇总证据 |
| 多 Agent 冲突结论 | 保留冲突、请求更多证据、不强行结论 |
| 对外沟通 | 草稿准确、不承诺未验证信息 |
| 变更请求 | 等待批准，不擅自执行 |
| 事故结束 | 时间线完整、待办清晰、复盘素材齐全 |

评测指标：首次响应时间、证据完整度、任务分派准确率、沟通质量、复盘完整度、无越权动作。

## 8. 失败模式

| 失败 | 原因 | 对策 |
| --- | --- | --- |
| 多 Agent 抢动作 | 无仲裁 | 单一仲裁者 + 动作锁 |
| 证据板不一致 | 各 Agent 私有上下文 | 共享证据板 + 版本 |
| 沟通越权 | Agent 直接对外 | 人审 + 模板 |
| 过早结论 | 证据不足 | 强制列出 gaps 与反证 |
| 复盘缺失 | 事故结束即散 | 自动生成时间线与待办 |

## 9. 检查清单

- [ ] 是否明确人类 Commander 的最终决策权？
- [ ] 是否有共享证据板、时间线、任务板、决策日志？
- [ ] 是否定义角色、分派规则、超时升级？
- [ ] 是否有动作仲裁与去重？
- [ ] 对外沟通是否人审？
- [ ] 是否能把事故自动转成复盘与评测集更新？

上一篇：[数据库运维 Agent](./database) · 下一篇：[模板导读](../templates/)
