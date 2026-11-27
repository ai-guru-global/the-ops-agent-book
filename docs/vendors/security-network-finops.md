---
title: 安全、网络与 FinOps
description: 安全运营、网络运维与云成本管理领域的 Agent 产品与选型边界。
owner: "Vendor Researcher"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 安全、网络与 FinOps

> 这三类 Agent 的共同点：**动作的风险高于“回答问题”**。安全 Agent 能隔离主机、封禁账号；网络 Agent 能改路由、PFC、ACL；FinOps Agent 能改资源规格、删闲置资源。默认只读、双人审批、可回滚是底线。
>
> 最后核实：**2026-11-25**；复核截止：**2027-02-22**。具体版本、自治能力与商业条款未取得证据时统一记为“未核实”。

::: diagram 图 40 · 安全动作审批与审计链 | synthetic/方法示意；证据不足不自动处置，拒绝/撤销/执行失败均进入审计，恢复不安全即升级，动作链结束须撤权留痕；本图不构成厂商能力证明。
```mermaid
flowchart TB
  R["安全 / 网络 / FinOps 告警<br/>或变更请求"]
  I["Agent 只读取证<br/>身份 / 权限 / 影响面"]
  Q{"证据与动作边界<br/>清楚且可验证？"}
  U["未核实<br/>补证或拒绝自动处置"]
  P["冻结动作计划<br/>目标 / 参数 / 回滚 / 时效"]
  AP{"授权审批通过？"}
  RJ["拒绝 / 撤销 / 过期<br/>禁止执行"]
  CK{"执行前重校验通过？<br/>双人 / 动作锁 / 窗口"}
  OP["Operator 执行<br/>短时凭证与 fencing token"]
  RES{"结果与业务指标<br/>验证通过？"}
  FAIL["失败 / 部分成功 / 结果未知<br/>停止后续步骤"]
  SAFE{"可安全恢复？"}
  RB["回滚 / 补偿<br/>重新验证"]
  ESC["人工升级 / 事故响应<br/>保留现场"]
  DONE["完成并归档<br/>效果 / 成本 / 证据"]
  AUD["贯穿全程的审计链<br/>谁 / 何时 / 计划哈希<br/>审批 / 工具 / 结果"]
  END["结束动作链<br/>退出本轮并保留审计"]

  R --> I --> Q
  Q -->|否| U
  U -->|补证| I
  U -->|无法补证 / 拒绝| ESC
  Q -->|是| P --> AP
  AP -->|拒绝 / 撤销 / 过期| RJ --> AUD
  AP -->|是| CK
  CK -->|未通过| RJ
  CK -->|是| OP --> RES
  RES -->|是| DONE --> AUD
  RES -->|否 / 失败| FAIL --> SAFE
  SAFE -->|是| RB --> RES
  SAFE -->|否| ESC --> AUD
  I -. "全程状态与调用" .-> AUD
  AUD --> END
```
:::

## 安全运营（SecOps）

| 厂商 | 产品 | 形态 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **Microsoft** | Security Copilot（SEC-01） | 安全 Agent 平台 | 官方 FAQ 支持安全问答、数据与合规、租户地域和 EU 数据边界；具体合同与跨境配置需另核 | SRC-MS-SECCOPILOT-COMPLIANCE-001 |
| **Google** | Security Operations (Gemini)（SEC-02） | 平台 AI + Agent | 官方文档支持 Standard/Enterprise/Enterprise Plus、SIEM/SOAR/UEBA/Gemini；UDM 可导自管 BigQuery，Enterprise Plus 不支持 BYOBQ；区域部署不跨区流量，多区域按 feeds 同步/异步复制；租户删除不自动取消计费 | SRC-GOOGLE-SECOPS-PACKAGES-001；SRC-GOOGLE-SECOPS-EXPORT-001；SRC-GOOGLE-SECOPS-DEPROVISION-001；SRC-GOOGLE-SECOPS-QUOTAS-001；SRC-GOOGLE-SECOPS-DR-001 |
| **Palo Alto Networks** | Cortex / AgentiX（SEC-03） | SecOps 平台 | 官方页面确认 Cortex 平台与 Cortex AgentiX 入口；原具体版本与 Agent 发现/行为治理能力未核实，已删除确定性表述 | SRC-PAN-CORTEX-001 |
| **CrowdStrike** | Charlotte AI / AgentWorks（SEC-04） | 安全 Agent 平台 | 官方页面描述跨 endpoint/identity/cloud/network 并行调查、共享上下文、prebuilt agents、无代码 AgentWorks、Agentic SOAR 与 MCP；默认不执行改变环境的动作，影响环境的动作需显式配置与授权审批 | SRC-CS-CHARLOTTE-001 |
| **SentinelOne** | Purple AI（SEC-05） | 安全 Agent | 官方页面支持 Agentic Investigation、Auto-Triage、Investigation Notebooks、预批准策略动作与零训练表述；GA 与商业细节未核实 | SRC-SENTINELONE-PURPLE-AI-001 |
| **Splunk (Cisco)** | Splunk Security AI（SEC-06） | 平台 AI | 官方页面支持 AI 辅助检测、分诊、调查、SOAR、恶意软件分析与响应；独立 SKU、GA 与商业细节未核实 | SRC-SPLUNK-AI-SECURITY-001 |
| **IBM** | QRadar（SEC-07） | 安全运营 | 官方页面描述 QRadar SIEM/SOAR/EDR、AI-driven analytics、威胁情报、SOAR 响应自动化、行为分析与跨云/终端/身份/网络关联 | SRC-IBM-QRADAR-001 |
| **DropZone AI** | AI SOC Analyst（SEC-08） | 独立 Agent | 官方产品页支持告警调查、Analyst 在售、Hunter Beta 与 EU 专属租户；客户效果为厂商自述 | SRC-DROPZONE-AISOC-001；SRC-DROPZONE-EU-001 |
| **Culminate / Datadog** | Bits Security Analyst（SEC-09） | 独立/平台 Agent | Datadog 官方发布说明支持 Bits Security Analyst GA 与 Cloud SIEM 自主调查；Culminate 独立产品状态未核实 | SRC-DD-BITS-SECURITY-001 |

安全 Agent 的额外要求：**行动控制**（隔离/封禁/改策略必须审批）、**身份与委托**（Agent 自己的身份、权限、凭证）、**审计**（谁批准、做了什么、影响面）、**对抗**（提示注入、工具投毒、记忆投毒）。

## 网络运维

| 厂商 | 产品 | 形态 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **Cisco** | Cloud Control / AI Canvas / Cisco IQ（NET-01） | 网络 Agent 工作空间 + AI 服务 | 官方支持人机协同工作空间、SaaS/本地/API 形态与资产导出；部分功能仍在开发，商业细节未核实 | SRC-CISCO-CLOUDCONTROL-001；SRC-CISCO-IQ-FAQ-001 |
| **Juniper (HPE)** | HPE Mist / Marvis VNA（NET-02） | 网络 AI 助手 + Agent | 官方文档支持 AI 洞察、Marvis 根因分析与动作建议；按 Base/Assurance/Marvis VNA 分权 | SRC-HPE-MIST-REQUIREMENTS-001 |
| **HPE Aruba** | Aruba Central + Mist AI（NET-03） | 网络 AI 平台 | 官方页面支持多智能体编排与 Copilot；agentic mesh 正在部署，Copilot 需 Advanced | SRC-ARUBA-CENTRAL-001；SRC-ARUBA-CENTRAL-SUBSCRIPTIONS-001 |
| **Arista** | CloudVision（NET-04） | 网络管理平台 | 官方页面支持 NetDL、AI/ML 分析、SaaS/本地部署、自动化与回滚；月订阅，具体条款未核实 | SRC-ARISTA-CLOUDVISION-001；SRC-ARISTA-EOS-LICENSING-001 |
| **Nokia** | Assurance Center（NET-05） | 网络 AIOps | 官方页面支持 AIOps 检测/关联、Agentic AI 推理、闭环、RCA 与预测；GA 与商业细节未核实 | SRC-NOKIA-ASSURANCE-001 |
| **华为** | iMaster NCE（NET-06） | 网络管控 | 官方产品页描述管理、控制、分析与 AI、开放网络 API，并称已在全球 120+ 国家部署；不是可用区或许可清单 | SRC-HW-IMASTERNCE-001 |
| **中兴** | UniSeer 智能运维（NET-07） | 网络 AIOps | 官方页面支持潜在故障识别与告警根因关系；GA 与商业细节未核实 | SRC-ZTE-UNISEER-001 |
| **H3C** | U-Center 统一运维平台（NET-08） | 网络 AIOps | 官方页面支持知识图谱、运维智能大脑、根因定位与故障预判；GA 与商业细节未核实 | SRC-H3C-UCENTER-001 |

网络 Agent 的关键不是“会聊天”，而是**拓扑、遥测、变更安全**：它必须知道改一条 PFC/ACL/路由会影响谁，并且能预演、回滚、双人审批。

## FinOps / 成本优化

| 厂商 | 产品 | 形态 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **IBM Apptio** | Cloudability（FIN-01） | FinOps 平台 | 官方页面描述云/AI/SaaS 成本视图、成本归属、预算/预测、异常告警、rightsizing、K8s 成本分配与 AI 用量拆分；官方文档确认 CSV/API 导出与 UAE/EU 区域托管，但不把“30%+”典型客户结果当保证 | SRC-IBM-CLOUDABILITY-001；SRC-IBM-CLOUDABILITY-2025-001；SRC-IBM-CLOUDABILITY-2024-001 |
| **Broadcom** | CloudHealth（FIN-02） | FinOps 平台 | 官方产品页支持多云/AI/token 成本、治理、FOCUS 与 Intelligent Assist；FlexReports 支持 Excel、邮件/S3 导出 | SRC-BROADCOM-CLOUDHEALTH-001；SRC-BROADCOM-FLEXREPORTS-001 |
| **Harness** | Cloud Cost Management（FIN-03） | FinOps 平台 | 官方产品页支持云/AI 成本归因、优化与治理；企业模块价格与退出未核实 | SRC-HARNESS-CCM-001 |
| **IBM Apptio** | Kubecost（FIN-04） | K8s FinOps | 官方产品页支持实时 K8s 成本、Free/Enterprise 与自托管；具体许可与导出未核实 | SRC-APPTIO-KUBECOST-001 |
| **Vantage** | 多云 FinOps（FIN-06） | FinOps 平台 | 官方定价页支持固定费率套餐与 CSV/API/Snowflake/Databricks 连接 | SRC-VANTAGE-PRICING-001 |
| **CloudZero** | 多云 FinOps（FIN-07） | FinOps 平台 | 官方定价与 API 文档支持商业订阅、小时成本和成本接口；完整退出未核实 | SRC-CLOUDZERO-PRICING-001；SRC-CLOUDZERO-API-001 |
| **Finout** | 多云 FinOps（FIN-08） | FinOps 平台 | 官方定价页支持固定年费、MegaBill 归因和 K8s 加购 | SRC-FINOUT-PRICING-001 |
| **Flexera** | Cloud Cost Optimization（FIN-09） | FinOps 平台 | 官方产品页支持成本分配、预算、治理与策略动作；官方条款（2026-10-15 生效）确认按 Spend Under Management 计费、超额 30 天补救/年度 True-Up；DPA 承诺停止服务后 60 天删除个人信息、不用第三方 API 数据训练 AI | SRC-FLEXERA-CCO-001；SRC-FLEXERA-LICENSE-METRICS-001；SRC-FLEXERA-DPA-001；SRC-FLEXERA-SECURITY-001 |
| **FinOps Foundation** | FinOps Framework / FOCUS（FIN-05） | 框架与规范 | 官方定义技术价值管理实践与跨云 FOCUS 账单导出；不是单一商业产品 | SRC-FINOPS-FOUNDATION-001 |

FinOps Agent 的典型任务是成本异常归因、闲置资源识别、规格建议、预算预警、变更前成本预估。**删除/降配必须审批**，并区分“建议节省”和“实际节省”。

## 商业字段证据卡

| claim_id / 产品 | 状态 | 区域 | 许可/计费单位 | 最低消费 / 超额 | 数据驻留 | 导出 / 退出 |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-03 Palo Alto Cortex / AgentiX | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| SEC-04 CrowdStrike Charlotte AI | 未核实 | 未核实 | 符合条件客户可在 Falcon console 使用，每月 50 AI credits 并续期 | 其他价格、最低消费与超额未核实 | 未核实 | 未核实 |
| SEC-07 IBM QRadar | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| FIN-01 IBM Cloudability | 现行产品文档持续更新；IBM Cloud 成本集成 GA，整体版本状态未核实 | 已核实 UAE 托管与欧洲区域发布；完整区域清单未核实 | 页面列 Essentials/Standard/Premium；具体许可单位未核实 | IBM Cloud 支出受合同 Monitored Cost Limit；普遍最低价/超额单价未核实 | 官方称 UAE/欧洲区域客户数据留在区域内；完整驻留与保留承诺未核实 | 报表 CSV、Resource Inventory API、CUR 2.0 CSV/Parquet；完整租户导出、删除时限与退出未核实 |
| SEC-01 Microsoft Security Copilot | 官方 FAQ；商业云在售 | 美政府云不支持；tenant Geo | SCU / E5-E7 分阶段 | 最低消费与超额未核实 | EU 租户且不共享时静态数据在 EU | 删除需支持入口；完整导出未核实 |
| SEC-08 DropZone AI | Analyst 在售；Hunter Beta | EU 可申请 | 企业/MSSP/联邦询价 | 未核实 | 官方支持 EU 专属租户 | 证据报告；保留至合同结束 |
| SEC-09 Datadog Bits Security Analyst | 官方发布说明 GA | 未核实 | Cloud SIEM；价格未核实 | 未核实 | 官方称第三方 AI 零留存/零训练 | API Preview；完整退出未核实 |
| FIN-03 Harness CCM | 官方产品页；整体 GA 未核实 | 未核实 | Enterprise 模块询价 | 未核实 | 未核实 | REST API/FOCUS；完整退出未核实 |
| FIN-04 Kubecost | IBM 产品页；整体 GA 未核实 | 自托管集群 | Free + Enterprise | 未核实 | 集群内 | JSON/CSV/PDF；完整退出未核实 |
| FIN-06 Vantage | 官方定价页 | 未核实 | Free / $30月 / $200月 / Custom | 未核实 | 未核实 | CSV/API/Snowflake/Databricks |
| FIN-07 CloudZero | 官方定价页 | 未核实 | 商业订阅；询价 | 未核实 | 未核实 | 成本 API 60 次/日；完整退出未核实 |
| FIN-08 Finout | 官方定价页 | 未核实 | 固定年费；K8s 加购 | 未核实 | 未核实 | API V2；完整退出未核实 |
| FIN-09 Flexera | 官方产品页在售；Product-Specific Terms 2026-10-15 生效 | 托管区域清单未核实 | CCO 按 Spend Under Management（Bill Source 未摊销 as-incurred 总额、扣折扣前、含税，订阅年度滚动累计）；Private Cloud 版按 Servers；单价询价 | 超额须 30 天内补购，否则提前 15 天通知可停用；年度 True-Up 只升不降低于上年；最低采购额未公开 | DPA 允许跨境转移（EU SCC Module 2/3、UK Addendum），无区域驻留承诺；不用第三方 API 数据训练 AI/ML | 停止服务后 60 天内删除剩余 Personal Information（合同/法律例外）；全量账单数据导出与退出流程未核实 |
| NET-01 Cisco Cloud Control / IQ | Cloud Control 部分功能仍在开发；IQ FAQ 列 Air-Gapped 自 2026-07 起 | IQ 支持 SaaS/On-Prem；区域驻留指向 Offer Disclosure | 未核实 | 未核实 | 未核实 | IQ 支持资产导出；完整退出未核实 |
| NET-02 HPE Mist / Marvis | 2026-10-30 官方文档在列 | 未核实 | Base/Assurance/Marvis VNA 分权 | 未核实 | 未核实 | 集成 Teams/Zoom；完整退出未核实 |
| NET-03 HPE Aruba Central | 官方称 agentic mesh 正在部署 | 云/本地/aaS/VPC 形态；区域清单未核实 | Foundation/Advanced；Copilot 需全设备 Advanced | 未核实 | 未核实 | 支持第三方遥测；完整退出未核实 |
| NET-04 Arista CloudVision | 官方产品页；整体 GA 未核实 | SaaS/本地部署；区域清单未核实 | 官方称按月订阅、约定期限 | 未核实 | 未核实 | API 与网络快照；完整退出未核实 |
| NET-05 Nokia Assurance Center | 官方产品页；整体 GA 未核实 | 官方称面向全球电信与关键任务企业；区域清单未核实 | 未核实 | 未核实 | 未核实 | 开放 API；完整退出未核实 |
| NET-06 iMaster NCE | 官方产品页；整体 GA 未核实 | 官方称 120+ 国家部署；非可用区清单 | 未核实 | 未核实 | 未核实 | 未核实 |
| NET-07 中兴 UniSeer | 官方页面；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| NET-08 H3C U-Center | 官方页面；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| SEC-02 Google SecOps | Standard/Enterprise/Enterprise Plus；整体 GA 未核实 | 区域部署单区不跨流量；多区域 geo-redundant，有 feeds 时存在 RPO；完整清单未核实 | 年度采购注入容量；Standard 含 12 个月热保留 | 1x–3x 突发不是免超额额度；最低金额/超额单价未核实 | 区域部署单区存储；多区域同步/异步取决于 feeds；Gemini/SOAR 边界未核实 | 八类 UDM/检测/指标导自管 BigQuery；Enterprise Plus 不支持 BYOBQ；历史数据不迁移；12 天软删后永久删除含备份，删除不取消计费；完整配置/SOAR 导出未核实 |
| SEC-05 SentinelOne Purple AI | 官方现行产品页；GA 未核实 | 未核实 | 未核实 | 未核实 | 官方称客户数据不用于训练；FedRAMP High | 未核实 |
| SEC-06 Splunk AI in Security | 官方现行产品页；独立 SKU/GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| FIN-02 Broadcom CloudHealth | 官方产品页；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | FlexReports Excel 下载、邮件/S3 投递；完整退出未核实 |
| FIN-05 FinOps Framework / FOCUS | 现行框架；2026-11 更新 | 跨云规范 | CC BY 4.0 | 不适用 | 不适用 | AWS/Azure/GCP/OCI 原生 FOCUS 账单导出 |

## 选型提示

- 安全/网络 Agent 优先看**动作控制**与**身份/委托**，而不是回答质量。
- 网络 Agent 必须接拓扑与遥测；没有拓扑的“网络 AI”只能做日志摘要。
- FinOps Agent 必须接账单、标签、资源与变更；否则只能做报表。
- 三类都要有**人审、回滚、审计**；默认只读，逐步升级到受控执行。
- 页面中的 benchmark、客户案例与厂商效果指标不能替代独立 POC。

## 来源与核实

最后核实：**2026-11-25**；复核截止：**2027-02-22**。未取得可靠官方正文的产品不保留确定性能力。完整清单见[来源注册表](../appendix/source-registry)与[参考资料](../appendix/references)。

下一篇：[内嵌 Agent 助手](./embedded-assistants)
