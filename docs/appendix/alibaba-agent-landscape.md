---
title: 阿里 Agent 产品全景
description: 官方 Agent 服务目录之外的阿里 Agent 运行时、框架、平台、治理与运维产品，以及它们与运维 Agent 生命周期的关系。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 附录：阿里 Agent 产品全景

> 阿里官方 Agent 服务目录是“可即用产品”的导航层，不是阿里 Agent 产品的全部。做运维 Agent 选型时，先分清你买的是“Agent 产品”“Agent 运行时”“Agent 框架”还是“Agent 治理平台”。目录数量具有时点性，本轮未重新计数，不再把历史数量写成当前事实。
>
> 最后核实：**2026-11-24**；复核截止：**2027-02-22**。官方文档、项目仓库与公开报道分开登记。
>
> 全球与中国主要厂商的横向地图见[厂商与产品全景](../vendors/)。本文只深潜阿里。

## 先分清五层

| 层 | 是什么 | 典型代表 | 对运维 Agent 的意义 | source_id |
| --- | --- | --- | --- | --- |
| **可即用 Agent 产品** | 官方目录中的产品导航（ALI-01） | 官方 Agent 服务目录 | 快速检索；目录数量与产品状态须按快照日核实 | SRC-ALI-CATALOG-001 |
| **Agent 运行时/基础设施** | 让 Agent 跑起来、隔离、观测 | AgentRun（ALI-02）、Agent Sandbox（ALI-03）、AgentBay（ALI-05） | 承载长任务、沙箱、弹性与执行边界 | SRC-ALI-AGENTRUN-001、SRC-ALI-SANDBOX-001、SRC-ALI-AGENTBAY-001 |
| **Agent 开发框架** | 用代码构建 Agent/多 Agent | AgentScope（ALI-06）、Spring AI Alibaba（ALI-08）、Qwen-Agent（ALI-07） | 自建、深度集成、可控编排 | COM-AGENTSCOPE-001、COM-SPRING-AI-ALIBABA-001、COM-QWEN-AGENT-001 |
| **Agent 开发/低代码平台** | 可视化/低代码构建 Agent、RAG、工具 | 百炼 / Model Studio（ALI-14，未核实） | 快速验证标准场景 | 未核实 |
| **Agent 治理/观测/协作** | 多 Agent 治理、可观测、评估优化 | AgentLoop、AgentTeams、AgentCore（ALI-09–11，公开报道）；STAROps（ALI-16，公开报道） | 具体能力未核实，不能据此认定生产可用 | PUB-ALI-SUMMIT-001 |

## 产品清单

> “官方文档/产品页”只支持页面明确写出的能力；“社区项目”支持项目自述；“公开报道”只支持报道口径。三者不能互相升级。

| 产品 | 类别 | 提供什么（claim） | 与运维 Agent 的关系 | 证据类型 / source_id |
| --- | --- | --- | --- | --- |
| **官方 Agent 服务目录**（ALI-01） | 可即用 Agent | 官方目录入口存在；本轮未重新计数 | 检索运维/数据库/安全/网络等 Agent 的导航 | official_doc / SRC-ALI-CATALOG-001 |
| **AgentRun**（ALI-02、ALI-04） | 运行时/基础设施 | Serverless Runtime、模型治理、Sandbox、MCP/Function Call、凭证、OpenTelemetry Trace 与 Token 成本归因；Computer/Mobile Use 是规划方向 | 承载自建运维 Agent；长任务、会话、弹性 | official_doc / SRC-ALI-AGENTRUN-001 |
| **Agent Sandbox**（ALI-03） | 执行隔离 | 安全隔离执行环境，提供代码执行、进程运行、文件操作、网络访问与状态管理 | 运维 Agent 执行脚本/工具的安全沙箱；兼容性未核实 | official_doc / SRC-ALI-SANDBOX-001 |
| **AgentBay**（ALI-05） | 执行隔离 | Browser、Computer、Code、Mobile 四类环境；SDK/MCP/ASP 访问 | 需要操作 GUI 的运维 Agent；状态持久化未核实 | official_doc / SRC-ALI-AGENTBAY-001 |
| **AgentScope**（ALI-06） | 开源框架 | 项目 README 描述 Agent Service、TeamPipeline 委派与 ModelRouterMiddleware；voice/SOP 为 Experimental | 自建多 Agent；项目“production-ready”自述不是独立生产验证 | community / COM-AGENTSCOPE-001 |
| **Qoder Cloud Agents**（ALI-15） | 托管运行时 | 能力与状态未核实 | 长任务/异步运维（场景建议） | 未核实 |
| **百炼 / Model Studio**（ALI-14） | 开发平台 | 能力与状态未核实 | 标准运维流程、知识库问答（场景建议） | 未核实 |
| **AgentLoop**（ALI-09） | 观测/评估 | 公开报道称其面向 Agent 观测/评估；具体能力未核实 | Trace、评测、持续优化（候选方向） | public_report / PUB-ALI-SUMMIT-001 |
| **AgentTeams**（ALI-10） | 多 Agent 协作/治理 | 公开报道口径；具体能力未核实 | 多 Agent 事故指挥、跨域协作（候选方向） | public_report / PUB-ALI-SUMMIT-001 |
| **AgentCore**（ALI-11） | 构建/治理平台 | 公开报道口径；具体能力未核实 | 构建、治理、观测（候选方向） | public_report / PUB-ALI-SUMMIT-001 |
| **Agentic OS**（ALI-17） | Agent-first OS | 能力与状态未核实 | 主机级运维 Agent、系统诊断（场景建议） | 未核实 |
| **STAROps**（ALI-16） | 运维平台 | 公开报道称其为全域智能运维平台；具体能力未核实 | 运维数据、流程、场景承载（候选方向） | public_report / PUB-ALI-SUMMIT-001 |
| **Spring AI Alibaba**（ALI-08） | Java 框架 | 项目站点描述 Agent Framework、Graph、Studio、Admin | Java 生态的运维 Agent 集成 | community / COM-SPRING-AI-ALIBABA-001 |
| **Qwen-Agent**（ALI-07） | Python 框架 | README 描述 instruction following、tool usage、planning、memory、Function Calling、MCP、RAG、Code Interpreter 等 | 快速构建 Qwen 生态 Agent；本地 Python executor 未沙箱化，仅限本地测试 | community / COM-QWEN-AGENT-001 |
| **Qoder CN 家族**（ALI-18） | Agent 产品族 | 官方页面描述编码、办公、IDE/JetBrains/CLI 等形态与国内部署；QoderWork CN 有停运/迁移说明 | 研发/办公 Agent；完整导出退出未核实 | official_doc / SRC-ALI-QODER-CN-001；SRC-ALI-QODER-CN-BILLING-001；SRC-ALI-QODERWORK-CN-001 |

## 关于 AgentScope 与 Agent Runtime

这两个名字最容易被混在一起：

- **AgentScope**：项目仓库自述的 Agent 框架，提供 Agent Service 与 TeamPipeline 等能力（ALI-06；COM-AGENTSCOPE-001）。它本身不是“一个可即用的运维 Agent”；Experimental 功能不得视为 GA。
- **Agent Runtime**：阿里云的运行时能力产品化落在 **AgentRun**（ALI-02；SRC-ALI-AGENTRUN-001）。官方文档描述 Serverless Runtime、模型治理、Sandbox、工具、凭证与观测；Computer/Mobile Use 仍为规划方向（ALI-04；SRC-ALI-AGENTRUN-001）。
- 因此，自建运维 Agent 的运行底座看 AgentRun/Agent Sandbox/AgentBay；现成产品导航看官方 Agent 服务目录。STAROps 与治理产品目前只有公开报道线索，需补官方文档。

## 映射到运维 Agent 生命周期

| 阶段 | 可用能力 / 候选方向 | 证据边界 |
| --- | --- | --- |
| **Plan** | 官方目录检索（ALI-01）；AgentRun/Model Studio 快速原型 | Model Studio 能力未核实 |
| **Design** | AgentScope/Spring AI Alibaba 编排；AgentBay/Agent Sandbox 执行边界 | 社区项目自述；需 POC |
| **Build** | AgentRun 代码/容器运行时、MCP/OpenAPI 工具 | 官方文档；Computer/Mobile Use 尚为规划 |
| **Validate** | AgentRun Sandbox、历史回放、影子/灰度；AgentLoop 为候选 | AgentLoop 仅公开报道，评估能力未核实 |
| **Release** | AgentRun 版本/Endpoint/灰度；Qoder Cloud Agents 为候选 | Qoder 能力未核实 |
| **Operate** | AgentRun 观测与 Token 成本归因；Agentic OS/STAROps 为候选 | 后两者能力未核实或仅公开报道 |
| **Improve** | AgentLoop/AgentTeams 为候选；评测集与 Runbook 迭代 | 具体评估、协作能力未核实 |

## 商业字段证据卡

| claim_id / 产品 | 状态 | 区域 | 许可/计费单位 | 最低消费 / 超额 | 数据驻留 | 导出 / 退出 |
| --- | --- | --- | --- | --- | --- | --- |
| ALI-01 官方目录 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| ALI-02、ALI-04 AgentRun | 未核实；Computer/Mobile Use 为规划方向 | 未核实；控制台链接不等于区域清单 | 未核实 | 缩容到 0、浅休眠计费有描述；具体价格/超额未核实 | VPC/IDC、PrivateLink、核心数据私有化为文档宣称；具体配置未核实 | 未核实 |
| ALI-03 Agent Sandbox | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| ALI-05 AgentBay | 未核实 | 产品页宣称 Singapore；完整区域未核实 | Basic package 与积分试用；正式计费单位未核实 | 新用户 100 points coupon；最低消费/超额未核实 | 未核实 | 未核实 |
| ALI-06 AgentScope | Experimental 功能不视为 GA；整体商业状态未核实 | 不适用/未核实 | README 称 Apache-2.0；服务条款另核 | 不适用/未核实 | 不适用/未核实 | 按具体仓库版本与许可证另核 |
| ALI-08 Spring AI Alibaba | 未核实 | 不适用/未核实 | 许可证未核实 | 不适用/未核实 | 不适用/未核实 | 未核实 |
| ALI-07 Qwen-Agent | 未核实；本地 Python executor 仅限本地测试 | 不适用/未核实 | 许可证未核实 | 不适用/未核实 | 不适用/未核实 | 未核实 |
| ALI-09–11、ALI-14–18 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |

## 选型建议

1. **先确定层级**：买“Agent 产品”还是“运行时/框架/平台”？不要拿框架和 Agent 产品做同一张对比表。
2. **先看可移植性**：工具契约、MCP/OpenAPI、Trace、评测集能否导出。
3. **先看运维场景需求**：长任务、沙箱、会话恢复、审批、审计、数据驻留。
4. **先用官方文档核验**：本附录是导航，不是采购建议；产品能力与计费以逐条 claim 的证据为准。
5. **不要被目录数量限制**：目录只是产品层快照；阿里 Agent 生态还包括运行时、框架、平台与治理产品。

## 来源

- SRC-ALI-CATALOG-001：[阿里云 Agent 服务目录](https://agentcatalog.aliyun.com/)
- SRC-ALI-AGENTRUN-001：[AgentRun 是什么](https://help.aliyun.com/zh/agentrun/what-is-agentrun)
- SRC-ALI-SANDBOX-001：[智能体沙箱 Agent Sandbox](https://help.aliyun.com/zh/agent-sandbox/)
- SRC-ALI-AGENTBAY-001：[无影 AgentBay](https://www.alibabacloud.com/en/product/agentbay)
- COM-AGENTSCOPE-001：[AgentScope GitHub](https://github.com/agentscope-ai/agentscope)
- COM-QWEN-AGENT-001：[Qwen-Agent GitHub](https://github.com/QwenLM/Qwen-Agent)
- COM-SPRING-AI-ALIBABA-001：[Spring AI Alibaba](https://spring-ai-alibaba.github.io)
- PUB-ALI-SUMMIT-001：[2026 阿里云峰会 Agent Native 产品报道](https://culture.ifeng.com/c/8tPjCX8bdEh)（公开报道，非官方能力证明）

最后核实：**2026-11-24**；复核截止：**2027-02-22**。完整字段与快照说明见[来源注册表](./source-registry)。
