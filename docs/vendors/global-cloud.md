---
pageClass: vendor-cloud
title: 全球云厂商
description: AWS、Microsoft、Google、IBM、Oracle、SAP、ServiceNow、Salesforce 的运维 Agent 与内嵌助手。
owner: "Vendor Researcher"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 全球云厂商

> 全球云厂商的产品结构正在收敛为三层：一个“值班/运维 Agent” + 一组内嵌助手 + 一个 Agent 运行时/平台。选型时先分清层，再比较能力。
>
> 最后核实：**2026-11-24**；复核截止：**2027-02-22**。`claim_id → source_id` 的完整定义见[来源注册表](../appendix/source-registry)。

## AWS

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **AWS DevOps Agent**（GC-AWS-01） | 独立运维 Agent | 发布、事件响应、可靠性 | 官方页面称可调查告警、给出根因与缓解步骤，接入 CloudWatch、Dynatrace、Datadog、Grafana、New Relic、Splunk 及代码/CI/CD；Release Management 明示为 Preview | SRC-AWS-DEVOPS-001 |
| **Amazon Q Developer**（GC-AWS-02） | 内嵌助手 | 开发 + 云工程 | 官方页面仍列 IDE/CLI 等入口；IDE 插件将于 2027-04-30 停止支持，其他形态能力与整体状态未核实 | SRC-AWS-QDEV-001 |
| **Amazon CloudWatch investigations / Omni**（GC-AWS-03） | 平台 AI 能力 | 可观测 | 能力未核实；候选文档只有跳转脚本，不能作为正文证据 | 未核实 |
| **Amazon Bedrock AgentCore**（GC-AWS-04） | Agent 运行时 | 通用 | Runtime、Memory、Gateway、Identity、Code Interpreter、Browser、Observability、Evaluations 等模块；Runtime 文档描述隔离会话、长时异步 Agent 与 MCP/A2A | SRC-AWS-AGENTCORE-001 |
| **AWS Quick**（GC-AWS-05；旧书称 Quick Suite / Q Business） | 内嵌/平台 | 企业知识与工作 | 官方页面称可从对话生成文档/表格/演示稿，做研究，构建应用，并连接 Slack、Salesforce、Notion、Jira、Box 等 | SRC-AWS-QUICK-001 |

AWS 的已核验共同点是“**Agent + 既有可观测/工单生态**”：DevOps Agent 的官方集成清单包含多家可观测与工单工具（GC-AWS-01；SRC-AWS-DEVOPS-001）。这不代表所有集成均已 GA，也不证明跨源调查效果。

## Microsoft

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **Azure SRE Agent**（GC-MS-01） | 独立/托管 SRE Agent | 可靠性、根因、缓解 | 官方页面描述多层根因调查、遥测关联、假设检验、事件知识复用、缓解执行、自定义子 Agent、外部 MCP 与 GitHub Copilot 协作；强调人工监督 | SRC-MS-SRE-001 |
| **Azure Copilot**（GC-MS-02） | 内嵌助手 | Azure 云运维 | 官方页面列出 Design、Operate、Optimize、Troubleshoot、Migrate、Deploy；migration agent 明示 public preview，不能推广到整个产品；动作需用户确认 | SRC-MS-COPILOT-001；SRC-MS-COPILOT-DOC-001 |
| **Microsoft Security Copilot**（GC-MS-03） | 安全运营 Agent 平台 | SecOps | 能力与状态未核实；本轮候选官方 URL 均未取得有效正文 | 未核实 |
| **Microsoft Foundry**（GC-MS-04） | Agent 平台 | 通用 | 官方页面描述 Agent 生命周期、模型选择/微调/路由、Agent Service、权限感知 grounding、连接器/MCP、Entra/Purview/Defender 治理、OpenTelemetry tracing 与 evaluators | SRC-MS-FOUNDRY-001 |
| **GitHub Copilot**（GC-MS-05） | 内嵌编码 Agent | 研发 | 官方页面描述从 issue/PR 开始工作、并行任务、跨 IDE/CLI/GitHub、代码审查、模型选择、自定义指令、连接器、MCP servers/skills/plugins | SRC-GH-COPILOT-001 |

Microsoft 的已核验路线是“**Azure Copilot + SRE Agent + Foundry + GitHub Copilot**”。Security Copilot 不在本轮能力结论内（GC-MS-03）。

## Google Cloud

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **Gemini Cloud Assist**（GC-GO-01） | 内嵌助手 | 云运维/可观测 | 能力与状态未核实；候选官方页面抓取失败 | 未核实 |
| **Gemini Agent**（GC-GO-02） | 通用工作 Agent | 跨 Workspace/企业系统 | 能力与状态未核实；原状态判断缺乏本轮证据，已移除 | 未核实 |
| **Gemini Enterprise / Workspace**（GC-GO-03） | 内嵌助手 | 办公/企业知识 | 能力与状态未核实 | 未核实 |
| **Google Security Operations (Gemini)**（GC-GO-04） | 安全运营 | SecOps | 能力与状态未核实 | 未核实 |
| **Gemini Code Assist**（GC-GO-05） | 内嵌编码助手 | 研发 | 能力与状态未核实 | 未核实 |
| **Agent Development Kit / Agentspace**（GC-GO-06） | Agent 平台 | 通用 | 能力与状态未核实 | 未核实 |

Google 条目仅保留产品导航；本轮不把发布报道或历史记忆升级为官方能力结论。

## IBM

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **IBM Concert**（GC-IBM-01） | AIOps/可观测平台 | 应用与基础设施运维 | 官方页面描述 Observe、Operate、Optimize、Protect、Resilience、Workflows，并整合可观测、优化、事件与暴露管理 | SRC-IBM-CONCERT-001 |
| **IBM Instana**（GC-IBM-02） | AIOps/可观测 | APM、基础设施 | 官方页面描述自动发现与插桩、实时全栈可观测、事件调查加速、性能/效率改进及 OpenTelemetry | SRC-IBM-INSTANA-001 |
| **IBM watsonx Orchestrate**（GC-IBM-03） | Agent 编排平台 | 通用/企业流程 | 官方页面描述构建/管理 Agent、Agent/workflow 编排、质量评估、治理与风险、成本控制、catalog 与 evaluation/observability | SRC-IBM-ORCH-001 |
| **IBM Turbonomic**（GC-IBM-04） | FinOps/自动化 | 成本与性能 | 官方页面描述全栈依赖与资源流、right-sizing、容量建模、策略驱动扩缩容及 compute/storage/network/GPU 优化 | SRC-IBM-TURBO-001 |
| **IBM QRadar**（GC-IBM-05） | 安全运营 | SecOps | 官方页面列出 QRadar SIEM、SOAR、EDR，并描述 AI 分析、行为分析、威胁情报、响应自动化与跨域关联 | SRC-IBM-QRADAR-001 |

IBM 的已核验组合覆盖“**可观测 + FinOps + 自动化 + 安全**”（GC-IBM-01–05；SRC-IBM-CONCERT-001、SRC-IBM-INSTANA-001、SRC-IBM-ORCH-001、SRC-IBM-TURBO-001、SRC-IBM-QRADAR-001）；是否适合既有 IBM 工具链仍需自行验证。

## Oracle / SAP / ServiceNow / Salesforce

| 厂商 | 产品 | 形态 | 运维相关性（claim） | source_id |
| --- | --- | --- | --- | --- |
| Oracle | OCI Generative AI Agents（GC-OR-01） | Agent 平台 | 能力与状态未核实；候选文档 404、产品页 403 | 未核实 |
| Oracle | OCI Operations Insights（GC-OR-02） | AIOps | 能力与状态未核实 | 未核实 |
| Oracle | Fusion AI Agents（GC-OR-03） | 内嵌业务 Agent | 能力与状态未核实 | 未核实 |
| SAP | Joule（GC-SAP-01） | 内嵌助手 | 能力与状态未核实；帮助门户未返回实质正文 | 未核实 |
| SAP | SAP Business AI Agents（GC-SAP-02） | Agent 平台/业务 Agent | 能力与状态未核实 | 未核实 |
| ServiceNow | Now Assist / AI Agents（GC-SN-01） | 内嵌助手 + Agent 平台 | 能力与状态未核实；社区入口未取得正文 | 未核实 |
| ServiceNow | AI Control Tower（GC-SN-02） | Agent 治理 | 能力与状态未核实 | 未核实 |
| Salesforce | Agentforce（GC-SF-01） | 内嵌业务 Agent | 官方页面描述员工/客服 Agent、CRM/Data 360 grounding、人工升级、Agent Builder、actions 与多 Agent 编排；未证明 IT 运维能力 | SRC-SF-AGENTFORCE-001 |

## 商业字段证据卡

| claim_id / 产品 | 状态 | 区域 | 许可/计费单位 | 最低消费 / 超额 | 数据驻留 | 导出 / 退出 |
| --- | --- | --- | --- | --- | --- | --- |
| GC-AWS-01 AWS DevOps Agent | 整体未核实；Release Management 为 Preview | 未核实（控制台链接指向 us-east-1，不等于区域清单） | 未核实 | 未核实 | 未核实 | 未核实 |
| GC-AWS-02 Amazon Q Developer | IDE 插件将于 2027-04-30 停服；其他形态未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| GC-AWS-04 AgentCore | 未核实 | 未核实 | 按量消费；官方称无预付承诺或最低费用 | 具体超额规则未核实 | 未核实 | 未核实 |
| GC-AWS-05 AWS Quick | 未核实 | 未核实 | 页面列 Free/Plus/Max 与组织版，按 user/month；组织版另有账户基础设施费 | Agent hours 因版本而异；具体额度、超额未核实 | 未核实 | 未核实 |
| GC-MS-01 Azure SRE Agent | 未核实 | 未核实 | Azure Agent Unit（AAU）；baseline 4 AAU/Agent/小时 | task 额外 0.25 AAU/秒；最低消费未核实 | 未核实 | 未核实 |
| GC-MS-02 Azure Copilot | migration agent 为 public preview；整体未核实 | 未核实；不适用于 national clouds | 当前 chat/agentic capabilities 无额外费用；Observability Agent 按 usage 计费 | 未来 Agent 价格、最低消费与超额未核实 | 未核实 | 未核实 |
| GC-MS-04 Microsoft Foundry | 未核实 | 未核实 | 按使用的各项服务各自计费 | 未核实 | 未核实 | 未核实 |
| GC-MS-05 GitHub Copilot | 未核实 | 未核实 | Free/Pro/Pro+/Max/Business/Enterprise；页面按 credits/user | 页面称超额 credits 为 $0.01/枚，可设预算；各计划额度/最低消费未核实 | 未核实 | 未核实 |
| GC-IBM-01–05 IBM 产品 | 未核实 | 未核实 | Instana 页面列 PayPerUse/SaaS/Self-Hosted；Orchestrate 列版本；其余许可单位未核实 | 未核实；Instana/Orchestrate 的结构化最低价单位不明，未采用 | 未核实；厂商数据主权表述不等于具体驻留证明 | 未核实 |
| GC-SF-01 Agentforce | 未核实 | 未核实 | 页面列 Flex Credits、Resolutions、per-user licensing | 未核实 | 未核实 | 未核实 |
| GC-AWS-03、GC-MS-03、GC-GO-01–06、GC-OR-01–03、GC-SAP-01–02、GC-SN-01–02 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |

## 选型提示

- **已有云生态**优先看该云厂商的 SRE/DevOps Agent 与内嵌助手；跨云/混合云看可观测与事件管理厂商。
- **要“能行动”**时，重点看身份、审批、dry-run、回滚、审计。官方页面出现“autonomous”不等于已获授权自动执行。
- **要避免锁定**时，优先支持 MCP/OpenAPI、可导出 Trace/评测集、可替换模型与运行时的方案。
- **状态与价格**按逐产品证据判断；不能用某个子功能的 Preview 推导整个产品状态。

## 来源与核实

最后核实：**2026-11-24**；复核截止：**2027-02-22**。所有可核验能力均回指 `sources/registry.yaml`；公开报道不作为本页官方能力结论。完整清单见[来源注册表](../appendix/source-registry)与[参考资料](../appendix/references)。

下一篇：[中国云厂商](./china-cloud)
