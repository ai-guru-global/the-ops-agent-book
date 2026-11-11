---
title: 可观测与 AIOps
description: Datadog、Dynatrace、New Relic、Splunk、PagerDuty、Grafana 等可观测/AIOps 厂商的 Agent 能力与选型要点。
---

# 可观测与 AIOps

> 运维 Agent 最密集的落点，不在云厂商，而在可观测与事件管理厂商：它们已经握着指标、日志、链路、拓扑、告警和值班流程。

## 四种技术路线

| 路线 | 代表 | 优势 | 局限 |
| --- | --- | --- | --- |
| **存量可观测平台 + AI** | Datadog Bits、Dynatrace Davis、New Relic AI | 数据面完整、上下文足 | 只覆盖自家数据面；附加计费 |
| **事件管理平台 + AI** | PagerDuty、incident.io、Rootly | 与值班/升级流程同栈 | 调查深度受限于事件数据 |
| **AI 原生运维 Agent** | Resolve.ai、Cleric、Metoro 等 | 以 Agent 为中心设计 | 数据接入与生态较新 |
| **K8s/开源专用 Agent** | Komodor、HolmesGPT、K8sGPT | 轻量、可自建、K8s 深度 | 覆盖面窄、治理需自建 |

## 主流产品

| 厂商 | 产品 | 形态 | 关键能力 | 备注 |
| --- | --- | --- | --- | --- |
| **Datadog** | Bits AI SRE / Bits Investigation / Bits Remediation / Bits Memories / AI Guard | 独立 AI SRE Agent + 平台能力 | 从告警自动调查、根因假设、修复动作、团队经验记忆、Agent 攻击防护；Scout 低成本 SRE 模型 | 按调查/Credits 计费；数据面为 Datadog |
| **Dynatrace** | Davis CoPilot / Dynatrace Intelligence / Cloud SRE Agents | 独立 AI SRE + 平台能力 | 基于 Smartscape 实时拓扑的因果分析；自主 SRE Agent、跨云修复编排；无代码自定义 Agent | 强在因果/拓扑，适合大型企业 |
| **New Relic** | New Relic AI / AI Monitoring | 平台 AI 能力 | 告警解释、根因、AI 应用监控 | 与 New Relic 数据面绑定 |
| **Splunk (Cisco)** | Splunk AI Assistant / Splunk ITSI | 平台 AI 能力 | SPL 辅助、告警/事件关联、ITSI 服务智能 | 与 Splunk 数据/安全生态结合 |
| **PagerDuty** | PagerDuty AI Agents / SRE Agent / AIOps | 事件管理 + Agent | 告警分诊、事件摘要、历史召回、通报草稿、复盘；值班/升级流程 | 强在事件流程；调查深度依赖数据 |
| **Grafana** | Grafana Assistant | 内嵌助手 | 查询、仪表盘、告警、可观测工作流辅助 | 开源/云生态 |
| **Elastic** | Elastic AI Assistant | 内嵌助手 | 日志/搜索/安全/可观测的自然语言辅助 | Elastic 数据面 |
| **Sumo Logic** | Mo Copilot | 内嵌助手 | 日志/可观测问答与调查 | Sumo 数据面 |
| **LogicMonitor** | Edwin AI | AIOps Agent | 告警、根因、异常检测、自动化 | 混合云/基础设施 |
| **ScienceLogic** | Skylar AI | AIOps | 事件关联、根因、自动化 | 大型 IT 运维 |
| **BigPanda** | BigPanda AI | AIOps | 告警关联、事件智能、变更关联 | 事件中心 |
| **OpsRamp (HPE)** | OpsRamp AI Agents | AIOps + Agent | 混合云监控、事件、自动化 | HPE 生态 |
| **BMC** | BMC Helix / HelixGPT | ITSM + AIOps | 工单、事件、变更、AIOps、生成式 AI | 大型企业 |
| **ManageEngine** | Zia / OpManager Nexus | 内嵌 Agent | 30+ 智能体嵌入 IT 管理产品；零额外 Token 成本（官方口径） | 中小企业/一体化 |
| **SolarWinds** | SolarWinds AI | 平台 AI 能力 | 网络/基础设施监控、AI 辅助 | 传统 IT 运维 |
| **Komodor** | Komodor AI | K8s Agent | K8s 故障排查、变更关联、根因 | K8s 专精 |
| **HolmesGPT** | HolmesGPT | 开源 K8s Agent | 告警调查、工具调用、根因 | 可自建/可接多数据源 |
| **K8sGPT** | K8sGPT | 开源 K8s Agent | 集群诊断、问题解释 | 轻量、社区 |
| **incident.io / Rootly / Resolve.ai / Cleric / Metoro** | 事件/运维 Agent | 独立 Agent | 事件响应、调查、自动化、SRE 协作 | 新一代 AI 原生平台 |
| **观测云** | Obsy Copilot | 内嵌助手 | 指标/日志/链路问答、调查、Skill/MCP | 国内可观测平台 |
| **嘉为蓝鲸 / 云智慧 / 擎创 / 炎龙** | AIOps 平台 + Agent | AIOps + Agent | 告警、根因、巡检、自动化、ITSM | 国内政企/金融/运营商 |

## 选型要点

1. **数据面覆盖率**：Agent 能不能看到你的全部指标、日志、链路、拓扑、变更、工单？只看自家数据面是最大盲区。
2. **调查深度**：是“告警摘要 + 问答”，还是能主动查询、形成假设、引用证据、给出可验证结论？
3. **行动边界**：只读、建议、审批执行、自动修复；默认只读，写操作要有审批、dry-run、回滚。
4. **计费结构**：按调查次数、Credits、事件量、主机数还是 Token？必须按真实工作负载算 TCO。
5. **数据驻留**：SaaS 数据出境对金融、政务、运营商是硬约束；确认私有化/区域化选项。
6. **可移植性**：Trace/评测集/知识能否导出；是否支持 OpenTelemetry、MCP、OpenAPI。

::: warning “AI 运维”概念泛化
很多产品只是把大模型接进告警通知：能摘要、能聊天，不能调查、不能行动。用“是否能形成证据链、是否能验证结果”来区分。
:::

下一篇：[安全、网络与 FinOps](./security-network-finops)
