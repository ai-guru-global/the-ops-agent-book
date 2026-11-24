---
title: 内嵌 Agent 助手
description: 既有产品中的 Agent 助手矩阵：Microsoft、Google、AWS、Alibaba、ServiceNow、Salesforce、SAP、Oracle 与可观测厂商。
owner: "Vendor Researcher"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 内嵌 Agent 助手

> 大多数企业第一次用到的“运维 Agent”，不是独立产品，而是既有产品里的助手：Azure Copilot、Grafana Assistant、Datadog Bits。其他条目只有导航，不能据此认定已具备运维能力。
>
> 最后核实：**2026-11-24**；复核截止：**2027-02-22**。同一 claim 在多个页面复用时保持相同 `claim_id` 与 `source_id`。

::: diagram 图 41 · 内嵌助手与独立 Agent 边界 | synthetic/方法示意；两条路径并列而非演进，内嵌助手不借用原产品之外的权限，跨域需求显式转交；未核实、拒绝、失败与退出均不静默降级，本图不构成厂商能力证明。
```mermaid
flowchart TB
  N["运维任务与证据需求"]
  B{"需要跨源调查<br/>或独立值班闭环？"}
  E["内嵌助手路径<br/>原产品 UI / 数据 / 权限"]
  EP{"原产品数据与权限<br/>覆盖且可核验？"}
  U["标记未核实<br/>不推断原产品之外能力"]
  ER["原产品内只读 / 建议<br/>动作沿用原权限"]
  EB{"需要跨域动作？"}
  H["显式交接<br/>不借道越权"]
  EG{"涉及原产品动作？"}
  EC{"原产品授权确认？"}
  RJ["拒绝动作<br/>仅保留建议"]
  EA["在原权限内受控执行"]
  EV["产品内验证<br/>引用证据 / 记录结果"]
  EF{"验证通过？"}
  F["失败 / 越界<br/>停止、恢复或退出"]
  A["独立 Agent 路径<br/>跨源接入 / 自有编排"]
  AD{"数据接入 / 身份 / 治理<br/>可核验？"}
  U2["标记未核实<br/>补齐或退出独立路径"]
  AR["独立调查与规划<br/>证据包 / 工具契约"]
  AG{"需要生产写？"}
  IV["只读调查结论<br/>跨域建议"]
  IA{"独立审批通过？"}
  IR["拒绝 / 撤销<br/>不执行"]
  IE["Operator 受控执行<br/>策略 / dry-run / 回滚"]
  IVR{"验证通过？"}
  IF["失败 / 部分成功<br/>停止、重规划或退出"]
  OUT["形成可审计结论<br/>保留权限与责任边界"]
  X["退出该路径<br/>撤销权限并记录原因"]

  N --> B
  B -->|否| E --> EP
  EP -->|否| U --> X
  EP -->|是| ER --> EB
  EB -->|是| H
  H -->|另建独立 Agent 评估| A
  H -->|不另建 / 拒绝越权| X
  EB -->|否| EG
  EG -->|否| EV --> OUT
  EG -->|是| EC
  EC -->|否| RJ --> EV
  EC -->|是| EA --> EF
  EF -->|是| EV
  EF -->|否| F
  F -. "修复后重试" .-> ER
  F -->|不可恢复 / 退出| X
  B -->|是| A --> AD
  AD -->|否| U2 --> X
  AD -->|是| AR --> AG
  AG -->|否| IV --> OUT
  AG -->|是| IA
  IA -->|拒绝 / 撤销| IR --> OUT
  IA -->|是| IE --> IVR
  IVR -->|是| OUT
  IVR -->|否 / 失败| IF
  IF -. "安全重规划" .-> AR
  IF -->|不可恢复 / 退出| X
```
:::

## 内嵌 vs 独立

| 维度 | 内嵌助手 | 独立 Agent |
| --- | --- | --- |
| 入口 | 既有产品 UI/工作流 | 独立控制台/API/IM |
| 数据面 | 原生产品数据 | 跨源接入 |
| 行动权限 | 受原产品权限模型约束 | 需要自建身份/审批 |
| 上线速度 | 快 | 中 |
| 锁定风险 | 高 | 取决于协议与可移植性 |
| 适合 | 日常运维、快速验证 | 跨域诊断、值班、复杂闭环 |

内嵌不等于能力弱。内嵌助手的优势在既有数据面与权限上下文；独立 Agent 的优势在跨源调查与行动编排。

## 矩阵

### Microsoft

| 产品 | 内嵌助手/Agent（claim） | 运维相关性 | source_id |
| --- | --- | --- | --- |
| Microsoft 365 Copilot（EMB-MS-01） | 能力未核实 | 运维知识、事故沟通、复盘草稿（场景建议，非能力证明） | 未核实 |
| Dynamics 365 Copilot（EMB-MS-02） | 能力未核实 | 业务/服务运营（场景建议） | 未核实 |
| Azure Copilot（GC-MS-02） | Design、Operate、Optimize、Troubleshoot、Migrate、Deploy；migration agent 为 public preview，动作需用户确认 | 云运维 | SRC-MS-COPILOT-001；SRC-MS-COPILOT-DOC-001 |
| Security Copilot（GC-MS-03） | 能力未核实 | SecOps | 未核实 |
| GitHub Copilot（GC-MS-05） | issue/PR、并行任务、IDE/CLI/GitHub、审查、模型选择、连接器与 MCP | 研发与 DevOps，不是运维 Agent | SRC-GH-COPILOT-001 |

### Google

| 产品 | 内嵌助手/Agent（claim） | 运维相关性 | source_id |
| --- | --- | --- | --- |
| Google Workspace Gemini（EMB-GO-01） | 能力未核实 | 运维知识、沟通（场景建议） | 未核实 |
| Gemini Enterprise（GC-GO-03） | 能力未核实 | 运维知识库、SOP（场景建议） | 未核实 |
| Gemini Cloud Assist（GC-GO-01） | 能力未核实 | 云故障排查、优化（场景建议） | 未核实 |
| Gemini Code Assist（GC-GO-05） | 能力未核实 | 研发（场景建议） | 未核实 |
| Google Security Operations（GC-GO-04） | 能力未核实 | SecOps（场景建议） | 未核实 |

### AWS

| 产品 | 内嵌助手/Agent（claim） | 运维相关性 | source_id |
| --- | --- | --- | --- |
| Amazon Q Developer（GC-AWS-02） | 官方页面仍列 IDE/CLI 等入口；IDE 插件将于 2027-04-30 停止支持，其他形态未核实 | 云工程、排障 | SRC-AWS-QDEV-001 |
| AWS Quick（GC-AWS-05；旧称 Quick Suite / Q Business） | 文档/表格/演示稿生成、研究、自然语言构建应用、工具连接 | 运维知识、工单、分析 | SRC-AWS-QUICK-001 |
| CloudWatch investigations / Omni（GC-AWS-03） | 能力未核实 | 告警调查（场景建议） | 未核实 |
| AWS DevOps Agent（GC-AWS-01） | 告警调查、根因与缓解步骤、可观测/代码/CI/CD 集成；Release Management 为 Preview | 事件响应/根因/可靠性；属于独立 Agent | SRC-AWS-DEVOPS-001 |

### 阿里云

| 产品 | 内嵌助手/Agent（claim） | 运维相关性 | source_id |
| --- | --- | --- | --- |
| 官方 Agent 服务目录（ALI-01） | 官方目录入口存在；本轮未重新计数，历史数量不作为当前事实 | 数据库、ECS、OSS、安全、网络、运维等导航 | SRC-ALI-CATALOG-001 |
| AgentRun（ALI-02） | Serverless Runtime、模型治理、Sandbox、MCP/Function Call、凭证与观测 | 承载自建运维 Agent；Computer/Mobile Use 为规划方向 | SRC-ALI-AGENTRUN-001 |
| Qoder Cloud Agents（ALI-15） | 能力与状态未核实 | 长任务/异步运维（场景建议） | 未核实 |
| 千问办公 / AgentOne（EMB-ALI-01） | 能力与状态未核实 | 办公/业务运营（场景建议） | 未核实 |

### 企业软件

| 产品 | 内嵌助手/Agent（claim） | 运维相关性 | source_id |
| --- | --- | --- | --- |
| ServiceNow Now Assist / AI Agents（GC-SN-01） | 能力与状态未核实 | 工单、事件、变更、AIOps（场景建议） | 未核实 |
| Salesforce Agentforce（GC-SF-01） | 业务 Agent、CRM/Data 360 grounding、人工升级、Agent Builder 与多 Agent 编排 | 服务运营；未证明 IT 运维能力 | SRC-SF-AGENTFORCE-001 |
| SAP Joule（GC-SAP-01） | 能力与状态未核实 | 业务运营（场景建议） | 未核实 |
| Oracle Fusion AI Agents（GC-OR-03） | 能力与状态未核实 | 业务运营（场景建议） | 未核实 |
| Workday Illuminate（EMB-ENT-01） | 能力与状态未核实 | 企业运营（场景建议） | 未核实 |
| Atlassian Rovo（EMB-ENT-02） | 能力与状态未核实 | 研发/ITSM 协作（场景建议） | 未核实 |

### 可观测厂商

| 产品 | 内嵌助手/Agent（claim） | 运维相关性 | source_id |
| --- | --- | --- | --- |
| Datadog Bits AI（OBS-01） | 当前页面展示 Chat、Investigation、Code、Security Analyst、Agent Builder | 可观测/事件 | SRC-DD-AI-001 |
| Dynatrace Davis（OBS-02） | 能力与状态未核实 | 可观测/可靠性（场景建议） | 未核实 |
| New Relic AI（OBS-03） | 自然语言查询、日志/堆栈、变更与仪表盘解释、代码级排障 | 可观测 | SRC-NR-AI-001 |
| Splunk AI Assistant（OBS-04） | 能力与状态未核实 | 可观测/安全（场景建议） | 未核实 |
| PagerDuty AI（OBS-05） | 能力与状态未核实 | 事件管理（场景建议） | 未核实 |
| Grafana Assistant（OBS-07） | 引导式对话、troubleshooting、dashboard、querying、alerting、incident response | 可观测 | SRC-GRAFANA-ASSIST-001 |
| Elastic AI Assistant（OBS-08） | ES\|QL、API、示例数据、可视化、排障、威胁研究与告警分诊 | 可观测/安全 | SRC-ELASTIC-AI-001 |

## 商业字段证据卡

| claim_id / 产品 | 状态 | 区域 | 许可/计费单位 | 最低消费 / 超额 | 数据驻留 | 导出 / 退出 |
| --- | --- | --- | --- | --- | --- | --- |
| GC-MS-02 Azure Copilot | migration agent 为 public preview；整体未核实 | 未核实；不适用于 national clouds | 当前 chat/agentic capabilities 无额外费用；Observability Agent 按 usage 计费 | 未来 Agent 价格、最低消费与超额未核实 | 未核实 | 未核实 |
| GC-MS-05 GitHub Copilot | 未核实 | 未核实 | 按计划与 credits/user；具体额度未核实 | 页面称超额 credits 为 $0.01/枚，可设预算 | 未核实 | 未核实 |
| GC-AWS-02 Amazon Q Developer | IDE 插件 2027-04-30 停服；其他形态未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| GC-AWS-05 AWS Quick | 未核实 | 未核实 | 按 user/month；组织版另有账户基础设施费 | Agent hours 因版本而异；超额未核实 | 未核实 | 未核实 |
| GC-AWS-01 AWS DevOps Agent | 整体未核实；Release Management 为 Preview | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| ALI-02 AgentRun | 未核实 | 未核实 | 未核实 | 浅休眠计费有描述；具体价格/超额未核实 | 私有化/网络隔离为文档宣称；具体配置未核实 | 未核实 |
| OBS-01 Datadog Bits AI | 未核实 | 未核实 | 定价入口含 AI Credits；具体单位未核实 | 未核实 | 未核实 | 未核实 |
| OBS-03 New Relic AI | 未核实 | 未核实 | 未核实 | 未核实 | 未核实；FedRAMP/HIPAA 客户当前不适用 | 未核实 |
| OBS-07 Grafana Assistant | 未核实 | 未核实 | 订阅与 AI Supplemental Terms；具体单位未核实 | 未核实 | 具体驻留未核实 | 未核实 |
| OBS-08 Elastic AI Assistant | Cloud Serverless 与 Stack 明示 GA | 未核实 | Managed LLM 需订阅/feature tier 并额外收费 | 额外成本存在；最低消费/超额未核实 | 第三方 provider 会处理数据；位置未核实 | 未核实 |
| GC-SF-01 Agentforce | 未核实 | 未核实 | Flex Credits、Resolutions、per-user licensing | 未核实 | 未核实 | 未核实 |
| EMB-MS-01–02、EMB-GO-01、GC-GO-01/03–05、GC-AWS-03、ALI-01/15、EMB-ALI-01、GC-SN-01、GC-SAP-01、GC-OR-03、EMB-ENT-01–02、OBS-02/04–05 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |

## 评估要点

1. **数据面**：助手能看到哪些数据？是否只限本产品？
2. **行动权限**：只能建议，还是能在审批下执行？权限是否可收紧？
3. **可扩展性**：能否接自定义工具/MCP、知识库、Runbook？
4. **治理**：身份、审计、数据驻留、模型选择、成本控制。
5. **锁定**：Prompt、知识、Trace、评测集能否导出？

::: tip 一个实用策略
日常运维先用内嵌助手（数据/权限现成），跨域诊断与复杂闭环用独立 Agent（跨源调查/行动编排），两者通过 MCP/OpenAPI/工单系统连接。
:::

## 来源与核实

最后核实：**2026-11-24**；复核截止：**2027-02-22**。场景建议不是厂商能力证据；产品能力必须回指 `source_id`。完整清单见[来源注册表](../appendix/source-registry)与[参考资料](../appendix/references)。

下一篇：[垂直行业运维 Agent](./vertical-ops)
