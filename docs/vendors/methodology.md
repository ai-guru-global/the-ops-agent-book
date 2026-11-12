---
title: 厂商评估方法
description: 如何评估运维 Agent 厂商：产品形态、数据面、行动边界、部署、治理、TCO、可移植性与 POC。
---

# 厂商评估方法

> 厂商演示的是“能力上限”，生产需要的是“可验证的下限”。用同一套框架评估所有厂商，避免被名词和 Demo 带走。

## 1. 先分层

| 层 | 问题 | 例子 |
| --- | --- | --- |
| 独立 Agent | 它能不能独立值班、调查、行动？ | AWS DevOps Agent、Azure SRE Agent、CloudQ、Bits AI SRE |
| 内嵌助手 | 它在哪个产品里？能看到什么数据？ | Azure Copilot、Gemini Cloud Assist、Now Assist |
| 运行时 | 它怎么跑、怎么隔离、怎么恢复？ | AgentRun、AgentCore、Agent Sandbox、Qoder Cloud Agents |
| 平台/框架 | 我怎么构建、编排、评测？ | AgentScope、百炼、Foundry、Spring AI Alibaba |
| AIOps 能力 | 它是传统 AIOps 加了 AI，还是 Agent 原生？ | Dynatrace、Datadog、ServiceNow、Splunk |

## 2. 八个评估维度

| 维度 | 关键问题 | 权重建议 |
| --- | --- | --- |
| **数据面** | 能接哪些指标/日志/链路/拓扑/变更/工单？盲区多大？ | 20% |
| **调查深度** | 能主动查询、形成假设、引用证据、验证结论吗？ | 15% |
| **行动边界** | 只读/建议/审批执行/自治？审批、dry-run、回滚、kill switch？ | 20% |
| **身份与治理** | Agent 身份、委托、最小权限、审计、数据驻留？ | 15% |
| **部署与集成** | SaaS/私有化/混合？与现有工具/流程集成成本？ | 10% |
| **评测与可观测** | 评测集、Trace、回归、异常检测、质量 SLO？ | 10% |
| **TCO** | 许可、按量、调查/Token、数据出口、实施、运维？ | 5% |
| **可移植性** | 工具契约、MCP/OpenAPI、Trace/评测集/知识可导出？ | 5% |

## 3. 证据分级

| 级别 | 证据 | 可信度 |
| --- | --- | --- |
| A | 官方文档、API、SLA、定价页 | 高 |
| B | 官方发布/大会演示/预览公告 | 中高 |
| C | 公开报道、分析师报告、客户案例 | 中 |
| D | 社区文章、第三方评测、Demo 视频 | 低，需要 POC 验证 |

本书的厂商地图会标注依据类型；产品状态（预览/商用）与能力以官方最新文档为准。

## 4. POC 设计

建议 4–6 周：

1. **第 1 周**：确定 3–5 个真实场景 + 黄金事故集。
2. **第 2 周**：接入数据（只读），验证调查质量与证据引用。
3. **第 3 周**：影子模式，与人工处理对比。
4. **第 4 周**：受控执行（低风险动作），验证审批、dry-run、回滚。
5. **第 5–6 周**：TCO/安全/治理评审，形成选型报告。

POC 必须用**你自己的数据**，不要只用厂商的演示环境。

## 5. 厂商话术检查

- “自主修复” → 有没有审批、dry-run、回滚、blast radius？
- “准确率 99%” → 数据集是什么？谁标注？失败模式是什么？
- “支持所有工具” → 有没有工具契约、权限、审计？
- “开箱即用” → 数据接入、身份、流程集成要多久？
- “按 Token 计费” → 调查/工具/沙箱/数据出口是否另计费？
- “预览版” → 什么时候 GA？SLA 是什么？

## 6. TCO 要算全

| 成本 | 内容 |
| --- | --- |
| 许可/订阅 | 席位、事件量、调查次数、Credits |
| 使用 | Token、模型、沙箱、存储、出口流量 |
| 实施 | 数据接入、工具适配、权限、流程、培训 |
| 运营 | 值班、评测、Prompt/知识/工具维护 |
| 风险 | 事故、合规、锁定、迁移 |

## 7. 覆盖与更新

- 本地图覆盖主要厂商与代表性产品，不是穷举。
- 产品名称、状态、能力、计费变化很快；本书标注“依据类型”，但使用前必须查官方文档。
- 欢迎提交 Issue/PR 补充厂商、纠正信息、提供真实 POC 经验。

## 8. 一页选型结论模板

```text
候选：
产品形态：
覆盖场景：
数据面：
行动边界：
身份/治理：
部署/集成：
评测/可观测：
TCO：
可移植性：
POC 结论：
风险与未决问题：
建议：
```

## 来源与核实

本页评估框架最后核实：**2026-11-12**。证据分级与 POC 方法为本书原创，外部标准与来源参考：

- [OWASP GenAI Security Project](https://genai.owasp.org/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [ISO/IEC 42001](https://www.iso.org/standard/81230.html)
- [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Google SRE Workbook](https://sre.google/workbook/table-of-contents/)

完整来源清单见[参考资料](../appendix/references)。
