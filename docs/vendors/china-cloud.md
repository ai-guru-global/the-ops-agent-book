---
pageClass: vendor-cloud
title: 中国云厂商
description: 阿里云、华为云、腾讯云、百度智能云、火山引擎、京东云、移动云、浪潮云与国产 AIOps 厂商的运维 Agent 地图。
---

# 中国云厂商

> 中国市场的运维 Agent 有三股力量：云厂商的“云上智能运维”、传统 AIOps/ITOM 厂商的“Agent 化升级”、以及 Agent 平台厂商的“运维场景下沉”。选型时同时看云生态绑定、信创/私有化与数据不出域。

## 阿里云

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **官方 Agent 服务目录** | 独立/内嵌 Agent | 数据库、计算、安全、网络、运维等 | 36 个官方 Agent + 328 个 Skills（2026-11 快照） | 官方目录 |
| **AgentRun** | Agent 运行时/基础设施 | 通用 | Serverless 运行时、Sandbox、模型治理、工具/MCP、凭证、观测 | 官方文档 |
| **AgentScope** | 开源框架 | 多 Agent | 多 Agent 编排、Runtime/Studio、A2A、FC 集成 | 官方 GitHub |
| **Agent Sandbox / AgentBay** | 执行隔离 | 通用 | 代码/浏览器/桌面/移动端沙箱、状态持久化 | 官方文档/产品页 |
| **百炼 / Model Studio** | Agent 平台 | 通用 | Agent 编排、RAG、工具、Skills、模型服务 | 官方文档 |
| **Qoder Cloud Agents** | 托管运行时 | 长任务/异步 | 全托管 Agent、长时任务、批量并发、会话/凭证/事件流 | 官方开发者社区 |
| **STAROps** | 运维平台 | 全域智能运维 | 运维数据、流程、场景承载；官方目录中有“智能运维助手” | 官方产品/公开报道 |
| **Agentic OS** | Agent-first OS | 主机/系统运维 | Alibaba Cloud Linux 4 Agentic Edition、Skills、安全执行 | 官方文档 |

阿里的特点是“**全栈**”：从官方 Agent 产品、Skills 生态，到 AgentRun/AgentScope/AgentBay 运行时，再到 STAROps 运维平台与 Agentic OS。

## 华为云 / 华为

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **智果 AgentArts** | 企业级 Agent 平台 | 行业 Agent | Agent 构建、部署、管理；行业知识、工程自优化、全链路可观测；开源版 openJiuwen | 官方发布/公开报道 |
| **MindOps** | 智能运维平台 | ICT 运维 | 领域模型增强、主动防控、数字孪生、多智能体协同 | 官方发布 |
| **iMasterCloud** | 云管/运维平台 | 多云/ICT | 智能云管、运维运营一体化、伙伴服务 | 官方发布 |
| **AEI（Agentic Enterprise ICT-infrastructure）** | 架构/体系 | 企业 ICT 运维 | 园区/数据中心/云端统一智能体架构、云边协同、数据飞轮 | 官方白皮书/公开报道 |
| **iMaster NCE** | 网络管控 | 网络运维 | 网络自治、AI 辅助、闭环控制 | 官方产品页 |
| **计算集群运维智能体** | 独立/平台能力 | 智算集群 | 超节点/万卡集群告警收敛、故障自恢复、节能调优 | 官方发布/公开报道 |

华为的路线是“**AEI + MindOps + 智果 AgentArts + 计算集群运维智能体**”，在运营商、政企、智算集群场景有强绑定。

## 腾讯云

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **CloudQ** | 独立 AIOps Agent | 多云运维/治理 | 全景图谱打通多云资源；资源管理、风险巡检、FinOps 优化、巡检值守；向多云 AIOps 智能体升级 | 官方发布/公开报道 |
| **MigraQ** | 独立 Agent | 上云迁移 | 迁移评估、方案、执行支持 | 官方发布/公开报道 |
| **AndonQ** | 独立 Agent | 售后技术支持 | 工单/技术支持场景的智能诊断与协同 | 官方发布/公开报道 |
| **WorkBuddy** | 内嵌/工作 Agent | 个人与团队工作流 | 将腾讯云服务经验封装为可对话、可交付结果的领域智能体 | 官方发布/公开报道 |
| **腾讯云智能体开发平台（ADP）** | Agent 平台 | 通用 | Agent 构建、知识库、工具、发布 | 公开资料 |
| **腾讯云可观测** | 平台 AI 能力 | 可观测/Agent 运行 | AI 运维、Agent 运行管理、Trace/指标/日志 | 官方发布/公开报道 |

腾讯的特点是“**CloudQ 多云 AIOps + 场景 Agent（MigraQ/AndonQ/WorkBuddy）+ 可观测**”，强调“用 AI 管运维，用可观测管 AI”。

## 百度智能云

| 产品 | 形态 | 运维域 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| **百度搭子** | 通用 Agent | 通用办公/工作 | 通用工作智能体 | 官方发布/公开报道 |
| **百度伐谋** | 专业 Agent | 工艺/优化 | 工艺参数寻优、复杂优化 | 官方发布/公开报道 |
| **百度胜算** | 专业 Agent | 经营/数据 | 经营分析与决策 | 官方发布/公开报道 |
| **百度秒哒** | 专业 Agent | 应用构建 | 无代码/低代码应用生成 | 官方发布/公开报道 |
| **百度智能云 Hogee** | 专业 Agent/平台 | 智能云 | 云上智能体/运维相关能力 | 官方发布/公开报道 |
| **文心快码** | 内嵌编码 Agent | 研发 | 代码生成、测试、审查 | 官方产品页 |
| **百度一镜** | 专业 Agent | 内容/媒体 | 内容生产 | 官方发布/公开报道 |
| **Agent Cloud / Agent Infra** | Agent 运行时/基础设施 | 通用 | 沙箱、身份权限、执行记录、模型路由 | 官方发布/公开报道 |
| **产业智能体操作系统** | Agent 平台/体系 | 产业 | 通用/专业/定制智能体协同、知识数据流程连接 | 官方发布/公开报道 |

百度的路线是“**产业智能体操作系统 + 专业智能体矩阵 + Agent Infra**”，强调行业知识与大模型/云基础设施结合。

## 火山引擎、京东云、移动云、浪潮云

| 厂商 | 产品 | 形态 | 运维域 | 依据 |
| --- | --- | --- | --- | --- |
| 火山引擎 | 智能运维助手 | 独立/平台 Agent | AI 原生全栈可观测运维中枢 | 公开报道 |
| 火山引擎 | HiAgent | Agent 平台 | Agent 构建、运行时、多人协作 | 官方产品页/公开资料 |
| 火山引擎 | 方舟 | 模型/Agent 平台 | 模型服务、Agent 构建 | 官方产品页 |
| 京东云 | 京东云智能运维 | AIOps/Agent | 告警降噪、异常检测、容量预测、智能变更评估 | 公开报道 |
| 移动云 | 大云智能运维 | AIOps/Agent | 告警治理、故障定位、运维知识库、自动处置 | 公开报道 |
| 浪潮云 | 云海智能运维平台 | AIOps | 异构资源监控、智能巡检、故障定位、容量管理 | 公开报道 |

## 国产 AIOps / ITOM 厂商

| 厂商 | 产品 | 形态 | 关键能力 | 依据 |
| --- | --- | --- | --- | --- |
| 嘉为蓝鲸 | AIOps 一体化数智运维平台 | AIOps + Agent | 一体化底座、平台化能力、智能巡检/告警/根因/自动化 | 官方/公开报道 |
| 云智慧 | AgenticAI / 轻帆云 ITSM | AIOps + ITSM | AI 原生运维、工单链路 AI、角色化 AI 员工 | 官方/公开报道 |
| 擎创科技 | 夏洛克 AIOps | AIOps | 多源运维数据关联、根因、预测 | 官方/公开报道 |
| 炎龙智能 | Agentic AIOps 平台 | AIOps + Agent | 智能巡检、根因、配置、自愈；覆盖 K8s/网络/数据库/中间件 | 官方产品页 |
| 新炬网络 | IT 运维智能体 | AIOps + Agent | 数据中心运维、数据库运维、多云运维；部分能力仍在研发 | 公开报道 |
| ManageEngine（国际，中国团队常用） | Zia / OpManager Nexus | AIOps + Agent | 30+ 智能体嵌入全栈 IT 管理产品，零额外 Token 成本 | 官方/公开报道 |

## 选型提示

- **云上为主**：优先云厂商自带的 AIOps/Agent，数据与权限打通最好；跨云/混合云看 CloudQ、Datadog、Dynatrace 等中立层。
- **信创/私有化**：看华为、浪潮、嘉为、云智慧、擎创、炎龙等；确认模型、数据、部署与审计是否满足要求。
- **Agent 平台 vs AIOps 产品**：平台给你“造 Agent”，AIOps 产品给你“现成的运维场景”；多数企业需要两者组合。
- **证据**：中国厂商的公开材料常混合“发布/预览/商用”，选型时必须要求官方文档、POC 与真实客户案例。

## 来源与核实

本页信息最后核实：**2026-11-12**。中国厂商产品命名与发布节奏变化快，表中“官方发布/公开报道”对应的具体来源如下：

- [阿里 Agent 产品全景（本书附录）](../appendix/alibaba-agent-landscape)
- [阿里云 Agent 服务目录](https://agentcatalog.aliyun.com/)
- [华为 MindOps / Agentic AI 运维报道](https://news.sina.cn/sx/2026-09-22/detail-inissitm5623944.d.html)
- [华为智能体 @AEI 白皮书报道](https://culture.ifeng.com/c/8wZOlujO5vw)
- [腾讯云 CloudQ 与 AI 可观测](https://www.bjnews.com.cn/detail/1793772689129886.html)
- [百度智能云产业智能体操作系统](https://m.tmtpost.com/nictation/8141994.html)
- [2026 国产运维智能体 TOP10 横评](https://baijiahao.baidu.com/s?id=1877001265169160727)
- [华为官网](https://www.huawei.com/) · [腾讯云](https://cloud.tencent.com/) · [百度智能云](https://cloud.baidu.com/) · [火山引擎](https://www.volcengine.com/) · [京东云](https://www.jdcloud.com/) · [浪潮](https://www.inspur.com/)

完整来源清单见[参考资料](../appendix/references)。

下一篇：[可观测与 AIOps](./observability-aiops)
