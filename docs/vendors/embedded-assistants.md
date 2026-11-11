---
title: 内嵌 Agent 助手
description: 既有产品中的 Agent 助手矩阵：Microsoft、Google、AWS、Alibaba、ServiceNow、Salesforce、SAP、Oracle 与可观测厂商。
---

# 内嵌 Agent 助手

> 大多数企业第一次用到的“运维 Agent”，不是独立产品，而是既有产品里的助手：Azure Copilot、Gemini Cloud Assist、Now Assist、Grafana Assistant、Datadog Bits。

## 内嵌 vs 独立

| 维度 | 内嵌助手 | 独立 Agent |
| --- | --- | --- |
| 入口 | 既有产品 UI/工作流 | 独立控制台/API/IM |
| 数据面 | 原生产品数据 | 跨源接入 |
| 行动权限 | 受原产品权限模型约束 | 需要自建身份/审批 |
| 上线速度 | 快 | 中 |
| 锁定风险 | 高 | 取决于协议与可移植性 |
| 适合 | 日常运维、快速验证 | 跨域诊断、值班、复杂闭环 |

内嵌不等于能力弱。很多内嵌助手拥有最好的数据面与权限上下文；独立 Agent 的优势在跨源调查与行动编排。

## 矩阵

### Microsoft

| 产品 | 内嵌助手/Agent | 运维相关性 |
| --- | --- | --- |
| Microsoft 365 Copilot | 办公文档/邮件/会议助手 | 运维知识、事故沟通、复盘草稿 |
| Dynamics 365 Copilot | 业务运营助手 | 业务运维/服务运营 |
| Azure Copilot | 部署、迁移、可观测、优化、韧性、故障排查代理 | 云运维核心 |
| Security Copilot | 安全调查、钓鱼分类、身份治理等代理 | SecOps |
| GitHub Copilot | 编码/测试/审查/现代化 | 研发与 DevOps，不是运维 Agent |

### Google

| 产品 | 内嵌助手/Agent | 运维相关性 |
| --- | --- | --- |
| Google Workspace Gemini | 文档/邮件/会议助手 | 运维知识、沟通 |
| Gemini Enterprise | 企业搜索/知识/工作助手 | 运维知识库、SOP |
| Gemini Cloud Assist | 云运维/可观测助手 | 云故障排查、优化 |
| Gemini Code Assist | 编码助手 | 研发，不是运维 |
| Google Security Operations | 安全调查/响应 | SecOps |

### AWS

| 产品 | 内嵌助手/Agent | 运维相关性 |
| --- | --- | --- |
| Amazon Q Developer | IDE/CLI/控制台助手 | 云工程、排障、资源优化 |
| Amazon Q Business / Quick Suite | 企业知识/工作助手 | 运维知识、工单、分析 |
| CloudWatch investigations/Omni | 可观测 AI | 告警调查 |
| AWS DevOps Agent | 独立 Agent（非内嵌） | 事件响应/根因/可靠性 |

### 阿里云

| 产品 | 内嵌助手/Agent | 运维相关性 |
| --- | --- | --- |
| 官方 Agent 服务目录 | 36 个官方 Agent | 数据库、ECS、OSS、安全、网络、运维等 |
| 百炼 / Model Studio | Agent 平台/助手 | 快速构建运维知识与流程 Agent |
| Qoder Cloud Agents | 托管 Agent | 长任务/异步运维 |
| 千问办公 / AgentOne | 企业 Agent 产品 | 办公/业务运营 |

### 企业软件

| 产品 | 内嵌助手/Agent | 运维相关性 |
| --- | --- | --- |
| ServiceNow Now Assist / AI Agents | ITSM/ITOM 助手 + Agent | 工单、事件、变更、AIOps |
| Salesforce Agentforce | 客服/销售/服务 Agent | 服务运营，IT 运维交集较少 |
| SAP Joule | 跨 SAP 业务流程助手 | 业务运维/运营 |
| Oracle Fusion AI Agents | 财务/供应链/HR Agent | 业务运营 |
| Workday Illuminate | HR/财务 Agent | 企业运营 |
| Atlassian Rovo | Jira/Confluence Agent | 研发/ITSM 协作 |

### 可观测厂商

| 产品 | 内嵌助手/Agent | 运维相关性 |
| --- | --- | --- |
| Datadog Bits | AI SRE/调查/修复 | 可观测/事件 |
| Dynatrace Davis | AI 根因/CoPilot/Cloud SRE | 可观测/可靠性 |
| New Relic AI | 告警/根因/AI 监控 | 可观测 |
| Splunk AI Assistant | SPL/告警/ITSI | 可观测/安全 |
| PagerDuty AI | 事件分诊/摘要/复盘 | 事件管理 |
| Grafana Assistant | 查询/仪表盘/告警 | 可观测 |
| Elastic AI Assistant | 日志/搜索/安全 | 可观测/安全 |

## 评估要点

1. **数据面**：助手能看到哪些数据？是否只限本产品？
2. **行动权限**：只能建议，还是能在审批下执行？权限是否可收紧？
3. **可扩展性**：能否接自定义工具/MCP、知识库、Runbook？
4. **治理**：身份、审计、数据驻留、模型选择、成本控制。
5. **锁定**：Prompt、知识、Trace、评测集能否导出？

::: tip 一个实用策略
日常运维先用内嵌助手（数据/权限现成），跨域诊断与复杂闭环用独立 Agent（跨源调查/行动编排），两者通过 MCP/OpenAPI/工单系统连接。
:::

下一篇：[垂直行业运维 Agent](./vertical-ops)
