---
title: 安全、网络与 FinOps
description: 安全运营、网络运维与云成本管理领域的 Agent 产品与选型边界。
---

# 安全、网络与 FinOps

> 这三类 Agent 的共同点：**动作的风险高于“回答问题”**。安全 Agent 能隔离主机、封禁账号；网络 Agent 能改路由、PFC、ACL；FinOps Agent 能改资源规格、删闲置资源。默认只读、双人审批、可回滚是底线。

## 安全运营（SecOps）

| 厂商 | 产品 | 形态 | 关键能力 | 备注 |
| --- | --- | --- | --- | --- |
| **Microsoft** | Security Copilot | 安全 Agent 平台 | 钓鱼分类、DLP、身份治理、条件访问优化、威胁调查；多代理嵌入安全工作流 | 与 Microsoft 安全栈深度绑定 |
| **Google** | Security Operations (Gemini) | 平台 AI + Agent | 告警调查、威胁分析、响应建议 | Google SecOps 数据面 |
| **Palo Alto Networks** | Cortex XSIAM / Prisma AIRS 3.0 | AIOps/SecOps + Agent 安全 | Agentic SOC、AI 代理发现/清单/行为监控/生命周期治理 | 强调 Agent 资产与行为基线 |
| **CrowdStrike** | Charlotte AI / AgentWorks | 安全 Agent 平台 | 调查问答、根因、横向移动追踪、自定义安全 Agent | Falcon 数据面 |
| **SentinelOne** | Purple AI | 安全 Agent | 告警调查、威胁狩猎、响应建议 | Singularity 平台 |
| **Splunk (Cisco)** | Splunk Security AI | 平台 AI | SIEM 调查、告警关联、SOAR 辅助 | Splunk 数据面 |
| **IBM** | QRadar Advisor / watsonx | 平台 AI | SIEM、威胁情报、调查辅助 | QRadar 生态 |
| **DropZone AI / Culminate** | AI SOC 分析师 | 独立 Agent | 告警分诊、调查、证据收集、升级 | 新一代 AI SOC |

安全 Agent 的额外要求：**行动控制**（隔离/封禁/改策略必须审批）、**身份与委托**（Agent 自己的身份、权限、凭证）、**审计**（谁批准、做了什么、影响面）、**对抗**（提示注入、工具投毒、记忆投毒）。

## 网络运维

| 厂商 | 产品 | 形态 | 关键能力 | 备注 |
| --- | --- | --- | --- | --- |
| **Cisco** | AI Canvas / Cloud Control / Cisco IQ | 网络 AI 工作空间 + Agent | 跨 Meraki/ThousandEyes/Splunk 遥测的故障排查、根因、建议/自动修复；AgenticOps 战略 | 与 Cisco 网络/安全栈结合 |
| **Juniper (HPE)** | Marvis / Mist AI | 网络 AI 助手 + Agent | 自然语言网络助手、Marvis Action 自动处置、数据中心/园区/WAN 覆盖 | HPE Aruba 整合中 |
| **HPE Aruba** | Aruba Central + Mist AI | 网络 AI 平台 | 园区/分支/WAN 运维、AI 洞察、自动修复 | 与 Juniper Mist 融合 |
| **Arista** | CloudVision | 网络管理平台 | 数据中心网络可视化、变更、遥测；AI 能力逐步增强 | 数据中心/云网络 |
| **Nokia** | AIOps/网络保障 | 网络 AIOps | 运营商网络保障、故障预测、闭环 | 电信运营商 |
| **华为** | iMaster NCE | 网络管控 | 网络自治、AI 辅助、闭环控制 | 运营商/政企 |
| **中兴 / H3C** | 网络 AIOps/管控 | 网络 AIOps | 网络监控、故障定位、自动化 | 国内运营商/政企 |

网络 Agent 的关键不是“会聊天”，而是**拓扑、遥测、变更安全**：它必须知道改一条 PFC/ACL/路由会影响谁，并且能预演、回滚、双人审批。

## FinOps / 成本优化

| 厂商 | 产品 | 形态 | 关键能力 | 备注 |
| --- | --- | --- | --- | --- |
| **IBM Apptio** | Cloudability | FinOps 平台 | 多云成本、预算、优化建议 | AI 能力因版本而异 |
| **Broadcom** | CloudHealth | FinOps 平台 | 成本、合规、优化 | 多云 |
| **Harness** | Cloud Cost Management | FinOps 平台 | 成本可视化、优化、策略 | 与 Harness 平台集成 |
| **Kubecost** | Kubecost | K8s FinOps | K8s 成本分摊、优化 | K8s 专精 |
| **Vantage / CloudZero / Finout / Flexera** | 多云 FinOps | FinOps 平台 | 成本归因、预算、优化 | AI/Agent 能力因产品而异 |

FinOps Agent 的典型任务：成本异常归因、闲置资源识别、规格建议、预算预警、变更前成本预估。**删除/降配必须审批**，并区分“建议节省”和“实际节省”。

## 选型提示

- 安全/网络 Agent 优先看**动作控制**与**身份/委托**，而不是回答质量。
- 网络 Agent 必须接拓扑与遥测；没有拓扑的“网络 AI”只能做日志摘要。
- FinOps Agent 必须接账单、标签、资源与变更；否则只能做报表。
- 三类都要有**人审、回滚、审计**；默认只读，逐步升级到受控执行。

## 来源与核实

本页信息最后核实：**2026-11-12**。安全/网络/FinOps 产品的 Agent 能力与计费口径差异很大，使用前请查官方文档：

- [Palo Alto Cortex](https://www.paloaltonetworks.com/cortex)
- [CrowdStrike Charlotte AI](https://www.crowdstrike.com/en-us/platform/charlotte-ai/)
- [IBM QRadar](https://www.ibm.com/products/qradar)
- [Arista CloudVision](https://www.arista.com/en/products/cloudvision)
- [IBM Apptio Cloudability](https://www.apptio.com/products/cloudability/)

Cisco、Juniper、Microsoft Security Copilot 等产品的具体能力以厂商官网为准；完整来源清单见[参考资料](../appendix/references)。

下一篇：[内嵌 Agent 助手](./embedded-assistants)
