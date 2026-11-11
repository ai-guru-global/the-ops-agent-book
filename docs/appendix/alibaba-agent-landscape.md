---
title: 阿里 Agent 产品全景
description: 官方 Agent 服务目录之外的阿里 Agent 运行时、框架、平台、治理与运维产品，以及它们与运维 Agent 生命周期的关系。
---

# 附录：阿里 Agent 产品全景

> 阿里官方 Agent 服务目录里的 36 个 Agent，只是“可即用、官方验证”的产品层切片，不是阿里 Agent 产品的全部。做运维 Agent 选型时，先分清你买的是“Agent 产品”“Agent 运行时”“Agent 框架”还是“Agent 治理平台”。

> 全球与中国主要厂商的横向地图见[厂商与产品全景](../vendors/)。本文只深潜阿里。

## 先分清五层

| 层 | 是什么 | 典型代表 | 对运维 Agent 的意义 |
| --- | --- | --- | --- |
| **可即用 Agent 产品** | 官方验证、可直接使用的 Agent | 官方 Agent 服务目录：36 个 Agent | 快速接入；但边界受产品定义限制 |
| **Agent 运行时/基础设施** | 让 Agent 跑起来、隔离、恢复、观测 | AgentRun、Agent Sandbox、AgentBay、Agentic OS、Qoder Cloud Agents | 承载长任务、沙箱、弹性、状态与执行安全 |
| **Agent 开发框架** | 用代码构建 Agent/多 Agent | AgentScope、Spring AI Alibaba、Qwen-Agent | 自建、深度集成、可控编排 |
| **Agent 开发/低代码平台** | 可视化/低代码构建 Agent、RAG、工具 | 百炼 / Model Studio、PAI、AgentRun AI Studio | 快速验证标准场景 |
| **Agent 治理/观测/协作** | 多 Agent 治理、可观测、评估优化 | AgentLoop、AgentTeams、AgentCore（公开报道）、STAROps | 让 Agent 可观测、可评测、可治理、可运营 |

## 产品清单

> 标记「官方文档」的条目可在官方文档直接核验；标记「公开报道」的条目来自 2026 阿里云峰会/官方开发者社区报道，使用前请以最新官方文档为准。

| 产品 | 类别 | 提供什么 | 与运维 Agent 的关系 | 来源 |
| --- | --- | --- | --- | --- |
| **官方 Agent 服务目录** | 可即用 Agent | 36 个官方 Agent + 328 个官方 Skills（2026-11 快照） | 可直接接入的运维/数据库/安全/网络等 Agent | 官方文档 |
| **AgentRun** | 运行时/基础设施 | Serverless Agent 运行时、Sandbox、模型治理、工具/MCP、凭证、观测 | 把自建运维 Agent 推到生产；长任务、会话、弹性 | 官方文档 |
| **AgentScope** | 开源框架 | 多 Agent 开发框架、Runtime/Studio、A2A、FC 集成 | 自建多 Agent、深度编排、可观测调试 | 官方 GitHub |
| **Agent Sandbox** | 执行隔离 | 安全隔离执行环境、代码/进程/文件/网络、E2B 兼容、K8s CRD | 运维 Agent 执行脚本/工具的安全沙箱 | 官方文档 |
| **AgentBay（无影）** | 执行隔离 | 浏览器/桌面/代码/移动端 GUI 沙箱、状态持久化 | 需要操作控制台/GUI 的运维 Agent | 官方产品页 |
| **Qoder Cloud Agents** | 托管运行时 | 云端托管 Agent、长时异步任务、批量并发、会话/凭证/事件流 | 7×24 长任务运维 Agent、异步巡检 | 官方开发者社区 |
| **百炼 / Model Studio** | 开发平台 | Agent 编排、RAG、工具、Skills、模型服务 | 快速验证标准运维流程、知识库问答 | 官方文档 |
| **AgentLoop** | 观测/评估 | Agent 全栈可观测、评估与优化 | Trace、评测、持续优化 | 公开报道 |
| **AgentTeams** | 多 Agent 协作/治理 | 多智能体治理与协作 | 多 Agent 事故指挥、跨域协作 | 公开报道 |
| **AgentCore** | 构建/治理平台 | 企业级 Agent 构建与治理（公开报道口径） | 统一构建、治理、观测 | 公开报道 |
| **Agentic OS** | Agent-first OS | Alibaba Cloud Linux 4 Agentic Edition、Skills、安全执行 | 主机级运维 Agent、系统诊断 | 官方文档 |
| **STAROps** | 运维平台 | 全域智能运维平台 | 运维数据、流程、场景承载 | 官方产品/公开报道 |
| **Spring AI Alibaba** | Java 框架 | Agent 框架、Graph 编排、Studio、Admin | Java 生态的运维 Agent 集成 | 官方站点 |
| **Qwen-Agent** | Python 框架 | 基于 Qwen 的 Agent 框架与工具 | 快速构建 Qwen 生态 Agent | 官方 GitHub |
| **Qoder CN 家族** | Agent 产品族 | Qoder CN、QoderWork、CLI、QoderWake、Cloud Agents、Mobile | 研发/办公/数字员工类 Agent | 官方开发者社区 |

## 关于 AgentScope 与 Agent Runtime

这两个名字最容易被混在一起：

- **AgentScope**：阿里巴巴通义实验室开源的多智能体开发框架，包含框架、Runtime、Studio 等层；适合自建、可控、多 Agent 协作。它本身不是“一个可即用的运维 Agent”。
- **Agent Runtime**：阿里云的 Agent 运行时能力产品化落在 **AgentRun**；`AgentRuntime` 是其 API 中的资源类型。AgentRun 提供 Serverless 运行时、Sandbox、模型治理、工具/MCP、凭证与观测。
- 因此，如果你的问题是“我自己写运维 Agent，跑在哪”，看 AgentRun/AgentScope Runtime/Agent Sandbox；如果你的问题是“有没有现成的运维 Agent 直接接”，看官方 Agent 服务目录与 STAROps 等产品。

## 映射到运维 Agent 生命周期

| 阶段 | 可用能力 |
| --- | --- |
| **Plan** | 官方 Agent 目录调研、百炼/AgentRun AI Studio 快速原型、AgentScope 代码验证 |
| **Design** | AgentScope/Spring AI Alibaba 编排、工具契约、AgentBay/Agent Sandbox 执行边界 |
| **Build** | AgentRun 代码/容器运行时、MCP/OpenAPI 工具、AgentScope Studio |
| **Validate** | AgentLoop 评估、AgentRun Sandbox、历史回放、影子/灰度 |
| **Release** | AgentRun/Qoder Cloud Agents 托管、版本与凭证、灰度 |
| **Operate** | AgentLoop 观测、Agentic OS 主机级运行、STAROps 运维流程 |
| **Improve** | AgentLoop 评估优化、AgentTeams 协作、评测集与 Runbook 迭代 |

## 选型建议

1. **先确定层级**：买“Agent 产品”还是“运行时/框架/平台”？不要拿框架和 Agent 产品做同一张对比表。
2. **先看可移植性**：工具契约、MCP/OpenAPI、Trace、评测集能否导出。
3. **先看运维场景需求**：长任务、沙箱、会话恢复、审批、审计、数据驻留。
4. **先用官方文档核验**：本附录是导航，不是采购建议；产品能力与计费以官方最新文档为准。
5. **不要被“36 个”限制**：官方目录是产品层快照；阿里 Agent 生态还包括运行时、框架、平台与治理产品。

## 来源

- [阿里云 Agent 服务目录](https://agentcatalog.aliyun.com/)
- [云 Skills 门户](https://help.aliyun.com/zh/skillsportal)
- [AgentRun 是什么](https://help.aliyun.com/zh/agentrun/what-is-agentrun)
- [AgentScope GitHub](https://github.com/agentscope-ai/agentscope)
- [智能体沙箱 Agent Sandbox](https://help.aliyun.com/zh/agent-sandbox/)
- [无影 AgentBay](https://www.alibabacloud.com/product/agentbay)
- [Agentic OS](https://help.aliyun.com/en/alinux/agentic-os)
- [Qoder CN 家族（含 Cloud Agents）](https://developer.aliyun.com/article/1770127)
- [百炼 Model Studio](https://help.aliyun.com/zh/model-studio/)
- [Spring AI Alibaba](https://java2ai.com/)
- [Qwen-Agent](https://github.com/QwenLM/Qwen-Agent)
- [2026 阿里云峰会 Agent Native 产品报道](https://culture.ifeng.com/c/8tPjCX8bdEh)

> 产品清单核对时间：2026-11-10。产品名称、能力与计费会变化，使用前请以官方文档为准。
