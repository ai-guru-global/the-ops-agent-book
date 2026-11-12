---
pageClass: vendor-cloud
title: 全球云厂商
description: AWS、Microsoft、Google、IBM、Oracle、SAP、ServiceNow、Salesforce 的运维 Agent 与内嵌助手。
---

# 全球云厂商

> 全球云厂商的产品结构正在收敛为三层：一个“值班/运维 Agent” + 一组内嵌助手 + 一个 Agent 运行时/平台。选型时先分清层，再比较能力。

## AWS

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **AWS DevOps Agent** | 独立运维 Agent | 事件响应、根因、可靠性 | 构建应用资源拓扑，关联 CloudWatch/Datadog/New Relic/Splunk 遥测、部署历史与配置；从告警/工单自动调查，给出根因与缓解建议；支持长期可靠性改进 | 官方发布/公开报道 |
| **Amazon Q Developer** | 内嵌助手 | 开发 + 云工程 | IDE/CLI/控制台中的代码、部署、排障、安全扫描、资源优化 | 官方产品页 |
| **Amazon CloudWatch investigations / Omni** | 平台 AI 能力 | 可观测 | 告警调查、日志/指标关联、AI 辅助排障 | 官方发布 |
| **Amazon Bedrock AgentCore** | Agent 运行时 | 通用 | Agent 运行时、工具、身份、记忆、可观测 | 官方产品页 |
| **Amazon Quick Suite / Q Business** | 内嵌/平台 | 企业知识与工作 | 企业知识问答、连接器、工作流；与运维知识库结合 | 官方产品页 |

AWS 的特点是“**Agent + 既有可观测/工单生态**”：DevOps Agent 不要求你替换 CloudWatch、Datadog、New Relic、Splunk、ServiceNow、PagerDuty，而是做跨源调查。

## Microsoft

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **Azure SRE Agent** | 独立/托管 SRE Agent | 可靠性、根因、修复 | 连接生产上下文与代码（GitHub），诊断问题、提出经过测试验证的修复方案；强调 HITL 治理 | 官方发布/公开报道 |
| **Azure Copilot** | 内嵌助手 | Azure 云运维 | 部署、迁移、可观测、优化、韧性、故障排查等专门代理；自然语言操作、成本/安全/可靠性建议 | 官方产品页/培训材料 |
| **Microsoft Security Copilot** | 安全运营 Agent 平台 | SecOps | 钓鱼分类、DLP、身份治理、条件访问优化、威胁调查等代理 | 官方产品页 |
| **Microsoft Foundry / Copilot Studio** | Agent 平台 | 通用 | Agent 构建、托管、连接器、治理 | 官方产品页 |
| **GitHub Copilot** | 内嵌编码 Agent | 研发 | 编码、测试、代码审查、现代化；不是运维 Agent，但与 DevOps 流程紧密 | 官方产品页 |

Microsoft 的路线是“**Copilot 全家桶 + SRE Agent + Agent 平台**”：Azure Copilot 覆盖日常运维，Azure SRE Agent 承担更深的事故调查与修复，Security Copilot 覆盖安全运营。

## Google Cloud

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **Gemini Cloud Assist** | 内嵌助手 | 云运维/可观测 | 云环境调查、故障排查、配置与优化建议 | 官方产品页 |
| **Gemini Agent** | 通用工作 Agent（私有预览） | 跨 Workspace/企业系统 | 给目标而非指令，规划任务、调用工具、长期运行；可承担部分运维/运营任务 | 官方发布/公开报道 |
| **Gemini Enterprise / Workspace** | 内嵌助手 | 办公/企业知识 | 企业搜索、文档、邮件、协作；与运维知识库结合 | 官方产品页 |
| **Google Security Operations (Gemini)** | 安全运营 | SecOps | 告警调查、威胁分析、响应建议 | 官方产品页 |
| **Gemini Code Assist** | 内嵌编码助手 | 研发 | 代码、测试、部署辅助；不是运维 Agent | 官方产品页 |
| **Agent Development Kit / Agentspace** | Agent 平台 | 通用 | Agent 构建、编排、企业搜索与工具 | 官方产品页 |

Google 的特点是“**Gemini 作为统一助手层 + 安全/云运维专用体验 + 开放 Agent 平台**”。

## IBM

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **IBM Concert** | AIOps/可观测平台 | 应用与基础设施运维 | 拓扑、风险、变更、生成式 AI 辅助洞察 | 官方产品页 |
| **IBM Instana** | AIOps/可观测 | APM、基础设施 | 自动发现、拓扑、根因、AI 辅助 | 官方产品页 |
| **IBM watsonx Orchestrate** | Agent 编排平台 | 通用/企业流程 | Agent 编排、工具、流程自动化 | 官方产品页 |
| **IBM Turbonomic** | FinOps/自动化 | 成本与性能 | 资源优化、成本/性能平衡 | 官方产品页 |
| **IBM QRadar** | 安全运营 | SecOps | SIEM、威胁检测、AI 辅助调查 | 官方产品页 |

IBM 的优势在“**可观测 + FinOps + 自动化 + 安全**”的组合，适合已有 IBM 工具链的大型企业。

## Oracle / SAP / ServiceNow / Salesforce

| 厂商 | 产品 | 形态 | 运维相关性 | 依据 |
| --- | --- | --- | --- | --- |
| Oracle | OCI Generative AI Agents | Agent 平台 | 企业 Agent 构建/托管 | 官方产品页 |
| Oracle | OCI Operations Insights | AIOps | 数据库/基础设施性能与容量 | 官方产品页 |
| Oracle | Fusion AI Agents | 内嵌业务 Agent | 财务/供应链/HR 等业务运营 | 官方产品页 |
| SAP | Joule | 内嵌助手 | 跨 SAP 业务流程的自然语言助手 | 官方产品页 |
| SAP | SAP Business AI Agents | Agent 平台/业务 Agent | 业务运营自动化 | 官方产品页 |
| ServiceNow | Now Assist / AI Agents | 内嵌助手 + Agent 平台 | ITSM、ITOM、AIOps、工单、变更、事件协同 | 官方产品页/公开报道 |
| ServiceNow | AI Control Tower“守护者” | Agent 治理 | 监控 Agent 行为、越规告警、中止/修正 | 公开报道 |
| Salesforce | Agentforce | 内嵌业务 Agent | 客服、销售、服务运营；与 IT 运维交集较少 | 官方产品页 |

## 选型提示

- **已有云生态**优先看该云厂商的 SRE/DevOps Agent 与内嵌助手；跨云/混合云看 Datadog、Dynatrace、PagerDuty 等中立层。
- **要“能行动”**时，重点看身份、审批、dry-run、回滚、审计；多数云厂商的 Agent 仍在“建议/受控执行”阶段。
- **要避免锁定**时，优先支持 MCP/OpenAPI、可导出 Trace/评测集、可替换模型与运行时的方案。

> 产品状态与计费以官方最新页面为准。AWS DevOps Agent、Azure SRE Agent、Gemini Agent 等均处于预览/快速演进阶段，上线前需重新核实。

## 来源与核实

本页信息最后核实：**2026-11-12**。表中“官方产品页/公开报道”对应的具体来源如下；未逐条引用的产品能力，使用前请查厂商官方文档。

- [AWS DevOps Agent](https://aws.amazon.com/devops-agent/)
- [Azure SRE Agent](https://azure.microsoft.com/en-us/products/sre-agent)
- [Azure Copilot](https://azure.microsoft.com/en-us/products/copilot)
- [Gemini at Work 2026（Google Cloud）](https://cloud.google.com/blog/products/ai-machine-learning/welcome-to-gemini-at-work-2026)
- [IBM Concert](https://www.ibm.com/products/concert)
- [ServiceNow Now Assist / AI Agents](https://www.servicenow.com/community/now-assist-articles/ai-agents-faq-and-troubleshooting/tac-p/3207986/highlight/true)
- [Oracle OCI Generative AI Agents](https://www.oracle.com/artificial-intelligence/generative-ai/agents/)
- [Salesforce Agentforce](https://www.salesforce.com/agentforce/)

完整来源清单见[参考资料](../appendix/references)。

下一篇：[中国云厂商](./china-cloud)
