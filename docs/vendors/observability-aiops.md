---
title: 可观测与 AIOps
description: Datadog、Dynatrace、New Relic、Splunk、PagerDuty、Grafana 等可观测/AIOps 厂商的 Agent 能力与选型要点。
owner: "Vendor Researcher"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 可观测与 AIOps

> 运维 Agent 最密集的落点，不在云厂商，而在可观测与事件管理厂商：它们已经握着指标、日志、链路、拓扑、告警和值班流程。
>
> 最后核实：**2026-11-24**；复核截止：**2027-02-22**。产品组合以本轮取得的官方页面为准，旧名称不自动沿用。

## 四种技术路线

| 路线 | 代表 | 优势 | 局限 |
| --- | --- | --- | --- |
| **存量可观测平台 + AI** | Datadog Bits、New Relic AI；Dynatrace 待核 | 数据面完整、上下文足 | 只覆盖自家数据面；附加计费须逐项核实 |
| **事件管理平台 + AI** | PagerDuty、incident.io、Rootly（待核） | 与值班/升级流程同栈 | 调查深度受限于事件数据 |
| **AI 原生运维 Agent** | Resolve.ai、Cleric、Metoro（待核） | 以 Agent 为中心设计 | 数据接入与生态较新 |
| **K8s/开源专用 Agent** | Komodor、HolmesGPT、K8sGPT（待核） | 轻量、可自建、K8s 深度 | 覆盖面窄、治理需自建 |

路线分类是本书分析框架，不代表对上述所有产品的能力背书。

## 主流产品

| 厂商 | 产品 | 形态 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **Datadog** | Bits AI（OBS-01） | 平台 AI + Agent Builder | 当前官方页面展示 Bits Chat、Investigation、Code、Security Analyst、Agent Builder；描述调查告警、根因/修复建议、代码修复、安全分诊与自定义 Agent。旧书 Bits AI SRE/Memories/AI Guard/Scout 组合未核实 | SRC-DD-AI-001 |
| **Dynatrace** | Davis CoPilot / Intelligence / Cloud SRE Agents（OBS-02） | 独立 AI SRE + 平台能力 | 能力与状态未核实；候选官方页面抓取失败 | 未核实 |
| **New Relic** | New Relic AI（OBS-03） | 平台 AI 能力 | 官方页面描述自然语言转查询、解释结果、分析错误日志/堆栈、变更调查、仪表盘解释与代码级排障；不证明自主修复 | SRC-NR-AI-001 |
| **Splunk (Cisco)** | Splunk AI Assistant / ITSI（OBS-04） | 平台 AI 能力 | 能力与状态未核实 | 未核实 |
| **PagerDuty** | PagerDuty AI Agents / SRE Agent / AIOps（OBS-05） | 事件管理 + Agent | 能力与状态未核实；候选官方 URL 404 | 未核实 |
| **Grafana** | Grafana Assistant（OBS-07） | 内嵌助手 | 官方文档描述引导式对话、troubleshooting、dashboard 管理、产品问答、querying、alerting 与 incident response；遵循 RBAC，部分能力需 full Grafana Cloud feature set | SRC-GRAFANA-ASSIST-001 |
| **Elastic** | Elastic AI Assistant（OBS-08） | 内嵌助手 | 官方文档描述 ES\|QL 查询、API 调用、示例数据、可视化、排障、威胁研究与告警分诊；能力因 solution 与权限而异 | SRC-ELASTIC-AI-001 |
| **Sumo Logic** | Mo Copilot（OBS-10） | 内嵌助手 | 能力与状态未核实；候选 URL 404 | 未核实 |
| **LogicMonitor** | Edwin AI（OBS-11） | AIOps Agent | 能力与状态未核实；候选 URL 404 | 未核实 |
| **ScienceLogic** | Skylar AI（OBS-09） | AIOps + Agentic AI | canonical 页面描述 Skylar Advisor 将告警/遥测/工单/文档转为建议与下一步行动，Topic Specialists 做多步调查；Skylar Analytics 做预测告警、异常检测与指标探索 | SRC-SCIENCELOGIC-SKYLAR-001 |
| **BigPanda** | BigPanda AI（OBS-12） | AIOps | 能力与状态未核实；候选页面无实质正文 | 未核实 |
| **OpsRamp (HPE)** | OpsRamp AI Agents（OBS-13） | AIOps + Agent | 能力与状态未核实；候选页面超时 | 未核实 |
| **BMC** | BMC Helix / HelixGPT（OBS-14） | ITSM + AIOps | 能力与状态未核实 | 未核实 |
| **ManageEngine** | Zia / OpManager Nexus（OBS-15） | 内嵌 Agent | 能力与状态未核实；原智能体数量与 Token 成本口径无有效来源，不采用 | 未核实 |
| **SolarWinds** | SolarWinds AI（OBS-16） | 平台 AI 能力 | 能力与状态未核实；候选 URL 404 | 未核实 |
| **Komodor** | Komodor AI（OBS-17） | K8s Agent | 能力与状态未核实 | 未核实 |
| **HolmesGPT** | HolmesGPT（OBS-18） | 开源 K8s Agent | 能力与状态未核实 | 未核实 |
| **K8sGPT** | K8sGPT（OBS-19） | 开源 K8s Agent | 能力与状态未核实 | 未核实 |
| **incident.io / Rootly / Resolve.ai / Cleric / Metoro** | 事件/运维 Agent（OBS-20） | 独立 Agent | 能力与状态未核实 | 未核实 |
| **观测云** | Obsy Copilot（OBS-21） | 内嵌助手 | 能力与状态未核实 | 未核实 |
| **嘉为蓝鲸 / 云智慧 / 擎创 / 炎龙** | AIOps 平台 + Agent（OBS-22） | AIOps + Agent | 能力与状态未核实；公开横评只作导航 | 未核实 |

## 商业字段证据卡

| claim_id / 产品 | 状态 | 区域 | 许可/计费单位 | 最低消费 / 超额 | 数据驻留 | 导出 / 退出 |
| --- | --- | --- | --- | --- | --- | --- |
| OBS-01 Datadog Bits AI | 未核实 | 未核实 | 官方定价入口含 AI Credits；具体计费单位与覆盖范围未核实 | Credits 额度、最低消费与超额未核实 | 未核实 | 未核实 |
| OBS-03 New Relic AI | 未核实 | 未核实 | 未核实 | 未核实 | 未核实；官方称 FedRAMP/HIPAA 客户当前不适用 | 未核实 |
| OBS-07 Grafana Assistant | 未核实 | 未核实 | 受 Grafana 订阅与 AI Supplemental Terms 约束；具体单位未核实 | 未核实 | 文档称遵循 RBAC、通过经审核的 provider；具体驻留未核实 | 未核实 |
| OBS-08 Elastic AI Assistant | Cloud Serverless 与 Elastic Stack 明示 GA | 未核实 | 需 privileges 与 LLM connector；Managed LLMs 需订阅/feature tier 并额外收费 | 额外成本存在；最低消费/超额未核实 | Elastic 称不用 customer data 训练；用户选择的第三方 provider 会处理数据，具体位置未核实 | 未核实 |
| OBS-09 ScienceLogic Skylar AI | 未核实 | 未核实 | 页面称 on-premises 与 SaaS；许可单位未核实 | 未核实 | 具体驻留未核实 | 未核实 |
| OBS-02、OBS-04–05、OBS-10–22 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |

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

## 来源与核实

最后核实：**2026-11-24**；复核截止：**2027-02-22**。第三方对比文章只保留为线索，不用于证明能力。完整清单见[来源注册表](../appendix/source-registry)与[参考资料](../appendix/references)。

下一篇：[安全、网络与 FinOps](./security-network-finops)
