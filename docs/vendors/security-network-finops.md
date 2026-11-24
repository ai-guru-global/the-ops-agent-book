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
> 最后核实：**2026-11-24**；复核截止：**2027-02-22**。具体版本、自治能力与商业条款未取得证据时统一记为“未核实”。

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
| **Microsoft** | Security Copilot（SEC-01） | 安全 Agent 平台 | 能力与状态未核实；候选官方 URL 未取得有效正文 | 未核实 |
| **Google** | Security Operations (Gemini)（SEC-02） | 平台 AI + Agent | 能力与状态未核实 | 未核实 |
| **Palo Alto Networks** | Cortex / AgentiX（SEC-03） | SecOps 平台 | 官方页面确认 Cortex 平台与 Cortex AgentiX 入口；原具体版本与 Agent 发现/行为治理能力未核实，已删除确定性表述 | SRC-PAN-CORTEX-001 |
| **CrowdStrike** | Charlotte AI / AgentWorks（SEC-04） | 安全 Agent 平台 | 官方页面描述跨 endpoint/identity/cloud/network 并行调查、共享上下文、prebuilt agents、无代码 AgentWorks、Agentic SOAR 与 MCP；默认不执行改变环境的动作，影响环境的动作需显式配置与授权审批 | SRC-CS-CHARLOTTE-001 |
| **SentinelOne** | Purple AI（SEC-05） | 安全 Agent | 能力与状态未核实；候选 URL 返回 429 | 未核实 |
| **Splunk (Cisco)** | Splunk Security AI（SEC-06） | 平台 AI | 能力与状态未核实 | 未核实 |
| **IBM** | QRadar（SEC-07） | 安全运营 | 官方页面描述 QRadar SIEM/SOAR/EDR、AI-driven analytics、威胁情报、SOAR 响应自动化、行为分析与跨云/终端/身份/网络关联 | SRC-IBM-QRADAR-001 |
| **DropZone AI / Culminate** | AI SOC 分析师（SEC-08） | 独立 Agent | 能力与状态未核实 | 未核实 |

安全 Agent 的额外要求：**行动控制**（隔离/封禁/改策略必须审批）、**身份与委托**（Agent 自己的身份、权限、凭证）、**审计**（谁批准、做了什么、影响面）、**对抗**（提示注入、工具投毒、记忆投毒）。

## 网络运维

| 厂商 | 产品 | 形态 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **Cisco** | AI Canvas / Cloud Control / Cisco IQ（NET-01） | 网络 AI 工作空间 + Agent | 能力与状态未核实；候选 AI Canvas URL 404 | 未核实 |
| **Juniper (HPE)** | Marvis / Mist AI（NET-02） | 网络 AI 助手 + Agent | 能力与状态未核实；候选 URL 404 | 未核实 |
| **HPE Aruba** | Aruba Central + Mist AI（NET-03） | 网络 AI 平台 | 能力与状态未核实 | 未核实 |
| **Arista** | CloudVision（NET-04） | 网络管理平台 | 能力与状态未核实 | 未核实 |
| **Nokia** | AIOps/网络保障（NET-05） | 网络 AIOps | 能力与状态未核实 | 未核实 |
| **华为** | iMaster NCE（NET-06） | 网络管控 | 能力与状态未核实 | 未核实 |
| **中兴 / H3C** | 网络 AIOps/管控（NET-07） | 网络 AIOps | 能力与状态未核实 | 未核实 |

网络 Agent 的关键不是“会聊天”，而是**拓扑、遥测、变更安全**：它必须知道改一条 PFC/ACL/路由会影响谁，并且能预演、回滚、双人审批。

## FinOps / 成本优化

| 厂商 | 产品 | 形态 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **IBM Apptio** | Cloudability（FIN-01） | FinOps 平台 | 官方页面描述云/AI/SaaS 成本视图、成本归属、预算/预测、异常告警、rightsizing、K8s 成本分配与 AI 用量拆分；不把“30%+”典型客户结果当保证 | SRC-IBM-CLOUDABILITY-001 |
| **Broadcom** | CloudHealth（FIN-02） | FinOps 平台 | 能力与状态未核实 | 未核实 |
| **Harness** | Cloud Cost Management（FIN-03） | FinOps 平台 | 能力与状态未核实 | 未核实 |
| **Kubecost** | Kubecost（FIN-04） | K8s FinOps | 能力与状态未核实；官网跳转到 Apptio 首页，未取得产品正文 | 未核实 |
| **Vantage / CloudZero / Finout / Flexera** | 多云 FinOps（FIN-05） | FinOps 平台 | 能力与状态未核实 | 未核实 |

FinOps Agent 的典型任务是成本异常归因、闲置资源识别、规格建议、预算预警、变更前成本预估。**删除/降配必须审批**，并区分“建议节省”和“实际节省”。

## 商业字段证据卡

| claim_id / 产品 | 状态 | 区域 | 许可/计费单位 | 最低消费 / 超额 | 数据驻留 | 导出 / 退出 |
| --- | --- | --- | --- | --- | --- | --- |
| SEC-03 Palo Alto Cortex / AgentiX | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| SEC-04 CrowdStrike Charlotte AI | 未核实 | 未核实 | 符合条件客户可在 Falcon console 使用，每月 50 AI credits 并续期 | 其他价格、最低消费与超额未核实 | 未核实 | 未核实 |
| SEC-07 IBM QRadar | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| FIN-01 IBM Cloudability | 未核实 | 未核实 | 页面列 Essentials/Standard/Premium；具体许可单位未核实 | 未核实 | 未核实 | 未核实 |
| SEC-01–02、SEC-05–06、SEC-08、NET-01–07、FIN-02–05 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |

## 选型提示

- 安全/网络 Agent 优先看**动作控制**与**身份/委托**，而不是回答质量。
- 网络 Agent 必须接拓扑与遥测；没有拓扑的“网络 AI”只能做日志摘要。
- FinOps Agent 必须接账单、标签、资源与变更；否则只能做报表。
- 三类都要有**人审、回滚、审计**；默认只读，逐步升级到受控执行。
- 页面中的 benchmark、客户案例与厂商效果指标不能替代独立 POC。

## 来源与核实

最后核实：**2026-11-24**；复核截止：**2027-02-22**。未取得可靠官方正文的产品不保留确定性能力。完整清单见[来源注册表](../appendix/source-registry)与[参考资料](../appendix/references)。

下一篇：[内嵌 Agent 助手](./embedded-assistants)
