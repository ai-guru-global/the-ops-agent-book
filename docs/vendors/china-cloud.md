---
pageClass: vendor-cloud
title: 中国云厂商
description: 阿里云、华为云、腾讯云、百度智能云、火山引擎、京东云、移动云、浪潮云与国产 AIOps 厂商的运维 Agent 地图。
owner: "Vendor Researcher"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 中国云厂商

> 中国市场的运维 Agent 有三股力量：云厂商的“云上智能运维”、传统 AIOps/ITOM 厂商的“Agent 化升级”、以及 Agent 平台厂商的“运维场景下沉”。选型时同时看云生态绑定、信创/私有化与数据不出域。
>
> 最后核实：**2026-11-25**；复核截止：**2027-02-22**。官方文档、官方产品页、公开报道分别登记，不混用。

::: diagram 图 38 · 中国云事实核验流 | synthetic/方法示意；官方事实、公开报道与营销宣称分账，证据冲突或正文缺失保持未核实，硬约束拒绝、POC 失败与退出均显式处理；本图不构成厂商能力证明。
```mermaid
flowchart TB
  L["线索 / 产品名<br/>报道 / 官网 / 社区"]
  P{"来源类型与正文<br/>可定位？"}
  F["拆分事实与宣称<br/>官方事实 / 公开报道 / 营销口径"]
  C{"证据支持<br/>且口径一致？"}
  U["逐字段标未核实<br/>请求官方材料 / 快照"]
  D{"部署 / 驻留 / 信创<br/>满足硬约束？"}
  RJ["拒绝候选<br/>记录硬约束缺口"]
  POC["隔离 POC<br/>只读取证 → 受控执行"]
  Q{"POC 证据与<br/>商业退出条件通过？"}
  FAIL["失败复盘<br/>补充材料或换候选"]
  OK["形成有限结论<br/>逐 claim 回指 source_id"]
  X["退出采购<br/>未核实项不默认通过"]

  L --> P
  P -->|可定位| F --> C
  P -->|无正文 / 仅营销| U
  U -->|取得新证据| P
  U -->|无法补齐| X
  C -->|支持且一致| D
  C -->|冲突 / 不足| U
  D -->|是| POC --> Q
  D -->|否| RJ --> X
  Q -->|否 / 失败| FAIL
  FAIL -->|整改后重测| POC
  FAIL -->|不可整改 / 超期| X
  Q -->|是| OK
  OK -. "复核失败或到期" .-> X
```
:::

## 阿里云

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **官方 Agent 服务目录**（ALI-01） | 独立/内嵌 Agent 导航 | 数据库、计算、安全、网络、运维等 | 官方目录入口存在；历史数量不作为当前事实，本轮未重新计数 | SRC-ALI-CATALOG-001 |
| **AgentRun**（ALI-02、ALI-04） | Agent 运行时/基础设施 | 通用 | 官方文档描述 Serverless Runtime、模型治理、Sandbox、MCP/Function Call、凭证、OpenTelemetry Trace 与 Token 成本归因；Computer/Mobile Use 明示为规划方向 | SRC-ALI-AGENTRUN-001 |
| **Agent Sandbox**（ALI-03） | 执行隔离 | 通用 | 官方帮助中心定义为安全隔离执行环境，提供代码执行、进程运行、文件操作、网络访问和状态管理；其他兼容性未核实 | SRC-ALI-SANDBOX-001 |
| **AgentBay**（ALI-05） | 执行隔离 | 通用 | 官方产品页描述 Browser、Computer、Code、Mobile 四类环境及 SDK/MCP/ASP 访问；页面宣称部署于 Singapore | SRC-ALI-AGENTBAY-001 |
| **AgentScope**（ALI-06） | 开源框架 | 多 Agent | 项目 README 描述 Agent Service、TeamPipeline 委派与 ModelRouterMiddleware；Realtime voice/SOP 标为 Experimental，不写成 GA | COM-AGENTSCOPE-001 |
| **百炼 / Model Studio**（ALI-14） | Agent 平台 | 通用 | 官方价格页证实模型服务按量计费与部分地域条目；安全文档确认默认防护免费自动启用、高级防护含 7 项策略与风险审计；完整 Agent 平台驻留与退出需按合同另核 | SRC-ALI-MODELSTUDIO-PRICING-001；SRC-ALI-AGENT-SECURITY-BILLING-001 |
| **Qoder Cloud Agents**（ALI-15） | 托管运行时 | 长任务/异步 | 官方计费文档支持个人 Credits 预付费、企业资源包及模型/沙箱按用量扣减；导出、删除与驻留未核实 | SRC-QODER-CLOUDAGENTS-BILLING-001 |
| **STAROps**（ALI-16） | 运维平台 | 全域智能运维 | 公开报道称其为全域智能运维平台；具体能力与生产可用性未核实 | PUB-ALI-SUMMIT-001 |
| **Alibaba Cloud Linux 4 Agentic Edition / Agentic OS**（ALI-17） | Agent-first OS | 主机/系统运维 | 官方文档称镜像免费、计算/存储/模型资源另计，核心组件已开源；支持 x86 并建议至少 2GB 内存 | SRC-ALI-AGENTICOS-001 |

阿里的已核验范围覆盖“**目录导航 + AgentRun 运行时 + 两类沙箱 + AgentScope 框架**”。公开报道条目单独标注，详见[阿里 Agent 产品全景](../appendix/alibaba-agent-landscape)。

## 华为云 / 华为

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **智果 AgentArts**（CN-HW-03） | 企业级 Agent 平台 | 行业 Agent | 官方文档描述 Managed Agents、运行时托管、观测评估、低代码编排与隔离沙箱；整体 GA 与商业条款未核实 | SRC-HW-AGENTARTS-001 |
| **MindOps 智算运维解决方案**（CN-HW-01） | 智能运维平台 | 智算/ICT 运维 | 官方发布页描述七层数字孪生、EDNS2.0、风险预测与自动排障；可用率数字为厂商宣称 | SRC-HW-MINDOPS-001 |
| **iMasterCloud**（CN-HW-04） | 云管/运维平台 | 多云/ICT | 官方文档支持运维数据上云、设备/告警/KPI 对接、WORD/PPT 报告导出及产业区域清单；许可与完整退出条款未核实 | SRC-HW-IMASTERCLOUD-001；SRC-HW-IMASTERCLOUD-DATA-001；SRC-HW-IMASTERCLOUD-REGIONS-001；SRC-HW-IMASTERCLOUD-ACCOUNT-001 |
| **Agentic 企业 ICT 基础设施 AEI**（CN-HW-02） | 架构/体系 | 企业 ICT 运维 | 官方 2026 白皮书提出 Adaptive Multi-Agent、Autonomous O&M、AI Native Infrastructure 三 A 愿景；独立商业产品状态未核实 | SRC-HW-AEI-2026-001 |
| **iMaster NCE**（CN-HW-05） | 网络管控 | 网络运维 | 官方产品页描述管理、控制、分析与 AI、开放网络 API，并称已在全球 120+ 国家部署；不是可用区或许可清单 | SRC-HW-IMASTERNCE-001 |
| **计算集群运维智能体“算小维”**（CN-HW-06） | 独立/平台能力 | 智算集群 | 官方视频确认第一代产品名；CCAE 官方技术文章支持跨域故障定位方向；商用状态与客户效果未核实 | SRC-HW-SUANXIAOWEI-001；SRC-HW-CCAE-001 |

华为产品仅保留两条公开报道线索：MindOps（CN-HW-01；PUB-HUAWEI-MINDOPS-001）与 AEI（CN-HW-02；PUB-HUAWEI-AEI-001）。本轮不把白皮书报道升级为生产能力证明。

## 腾讯云

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **CloudQ**（CN-TX-01） | 独立 AIOps Agent | 多云运维/治理 | 公开报道称其面向多云资源与运维治理；具体能力与状态未核实 | PUB-TENCENT-CLOUDQ-001 |
| **MigraQ**（CN-TX-02） | 独立 Agent | 上云迁移 | 公开报道提及迁移场景；具体能力与状态未核实 | PUB-TENCENT-CLOUDQ-001 |
| **AndonQ**（CN-TX-03） | 独立 Agent | 售后技术支持 | 公开报道提及技术支持场景；具体能力与状态未核实 | PUB-TENCENT-CLOUDQ-001 |
| **WorkBuddy**（CN-TX-04） | 内嵌/工作 Agent | 个人与团队工作流 | 公开报道提及工作智能体；具体能力与状态未核实 | PUB-TENCENT-CLOUDQ-001 |
| **腾讯云智能体开发平台（ADP）**（CN-TX-05） | Agent 平台 | 通用 | 官方产品页支持多渠道接入、云部署与私有化 License；私有化部署在客户自有腾讯云 TKE | SRC-TX-ADP-001 |
| **腾讯云可观测平台（TCOP）**（CN-TX-06） | 平台 AI 能力 | 可观测/Agent 运行 | 官方产品页描述指标/链路/日志/事件一体化监控，AI 工作台处于免费公测；不证明自主调查或修复效果 | SRC-TX-TCOP-001 |

腾讯条目属于公开报道口径（PUB-TENCENT-CLOUDQ-001）；不得据此推断 GA、区域或许可。

## 百度智能云

| 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| **产业智能体操作系统**（CN-BD-01） | Agent 平台/体系 | 产业 | 公开报道称其连接通用/专业/定制智能体与知识数据流程；具体能力与状态未核实 | PUB-BAIDU-INDUSTRY-001 |
| **百度千帆 Agent Infra**（CN-BD-02） | Agent 运行时/基础设施 | 通用 | 官方发布说明列出模型、工具、Agent 开发、数据与 Agent 运行环境五层能力；Agent Cloud 独立产品页未核实 | SRC-BD-QIANFAN-AGENTINFRA-001 |
| **百度搭子开发平台**（CN-BD-03） | Agent 开发/运行平台 | 通用 | 官方页面描述一站式 Agent 开发运行、Skills/MCP/Workflow、托管 Harness、审计与 OpenTelemetry；支持公有云和私有化 | SRC-BD-DUMATE-001 |
| **百度伐谋**（CN-BD-04） | 专业 Agent | 工艺/优化 | 官方页面描述自我演化智能体与轻量/专业/混合云/私有化形态；不证明运维场景效果 | SRC-BD-FAMOU-001 |
| **百度胜算·数据智能平台**（CN-BD-05） | 数据智能/Agent 平台 | 经营/数据 | 官方产品页描述业务本体、Action/Data Agent、购买/试用与私有化；版本文档说明包年包月与到期数据删除 | SRC-BD-DATABUILDER-001；SRC-BD-DATABUILDER-VERSIONS-001 |
| **百度秒哒 MIAODA**（CN-BD-06） | 专业 Agent | 应用构建 | 官方文档说明新应用多数可下载源码；旧应用不支持导出，复杂应用需二次开发；不等于完整数据/评测/Trace 可迁移 | SRC-BD-MIAODA-EXPORT-001 |
| **Hogee 企业一站式 AI 营销应用**（CN-BD-07） | 专业 Agent/平台 | 营销/数据 | 官方计费与隐私文档支持订阅+积分、数字员工/营销/分析场景、境内处理原则与注销处理规则 | SRC-BD-HOGEE-BILLING-001；SRC-BD-HOGEE-PRIVACY-001 |
| **文心快码 COMATE**（CN-BD-08） | 内嵌编码 Agent | 研发 | 官方文档支持多智能体、代码补全、MCP、AI IDE 与 SaaS/混合云/私有化；定价按人月，私有化询价 | SRC-BD-COMATE-PRODUCT-001；SRC-BD-COMATE-PRICING-001；SRC-BD-COMATE-DATA-001 |
| **百度一镜数字人 API**（CN-BD-09） | 专业 Agent | 内容/媒体 | 官方产品页描述智能主播/展现/脚本/互动/场控五类能力与 SaaS/PaaS 购买入口；商业细节未核实 | SRC-BD-YIJING-API-001 |

百度仅保留两条公开报道线索：产业智能体操作系统（CN-BD-01）与 Agent Cloud / Agent Infra（CN-BD-02），均回指 PUB-BAIDU-INDUSTRY-001。

## 火山引擎、京东云、移动云、浪潮云

| 厂商 | 产品 | 形态 | 运维域 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- | --- |
| 火山引擎 | 智能运维助手（CN-OT-01） | 独立/平台 Agent | 可观测运维 | 官方文档明确公测，支持自然语言智能运维任务、自动化任务与响应计划 | SRC-VOLC-OPSASSISTANT-001 |
| 火山引擎 | HiAgent（CN-OT-02） | Agent 平台 | 通用 | 官方产品页支持智能体开发/运行/消费/治理、私有化数据不出域、审计与模型防火墙；商业条款未核实 | SRC-VOLC-HIAGENT-001 |
| 火山引擎 | 火山方舟（CN-OT-03） | 模型/Agent 平台 | 通用 | 官方计费文档支持实时/批量推理按 token 后付费、不调用不计费；完整 Agent 平台能力未核实 | SRC-VOLC-ARK-PRICING-001 |
| 京东云 | 京东云 AIOps 日志异常检测（CN-OT-04） | AIOps | 云运维 | 官方开发者社区历史文章描述 NLP 日志异常检测；当前产品 SKU 与 GA 未核实 | SRC-JD-AIOPS-001 |
| 移动云 | 智算平台运维智能体（CN-OT-05） | AIOps/Agent | 智算运维 | 官方帮助文档支持专属集群性能指标问答与历史对话；未确认产品名“大云智能运维”，区域/许可/驻留未知 | SRC-CMCC-OPSAGENT-001 |
| 浪潮云 | 云海 InCloud Manager（CN-OT-06） | AIOps/云管 | 云运维 | 官方产品页描述私有云资源管理、监控/日志/智能运维与自动化体系；不证明独立 Agent 状态 | SRC-INSPUR-INCLOUD-MANAGER-001 |

## 国产 AIOps / ITOM 厂商

| 厂商 | 产品 | 形态 | 关键能力（claim） | source_id |
| --- | --- | --- | --- | --- |
| 嘉为蓝鲸 | AIOps 一体化数智运维平台（CN-DOM-01） | AIOps + Agent | 第三方横评仅作导航；具体能力与状态未核实 | PUB-CHINA-TOP10-001 |
| 云智慧 | 智能 ITSM / 轻帆云（CN-DOM-02） | AIOps + ITSM | 官方产品页描述生成式 AI 赋能工单、服务台、知识库与 AI 助理，支持 SaaS/私有化租赁；AgenticAI 独立状态未核实 | SRC-CLOUDWISE-ITSM-001 |
| 擎创科技 | 夏洛克 AIOps（CN-DOM-03） | AIOps | 官方页面描述一体化数智运维、统一数据/监控/告警/分析/决策与信创适配自述 | SRC-EOITEK-AIOPS-001 |
| 炎龙智能 | SREAgent / Agentic AIOps（CN-DOM-04） | AIOps + Agent | 官方产品页描述企业版 V4.17.1、私有部署与数据不出域；认证与效果需独立验证 | SRC-YANLONG-SREAGENT-001 |
| 新炬网络 | IT 运维 AI 智能体 / ZnDBCloud（CN-DOM-05） | AIOps + Agent | 官方新闻描述 AI 智能体接入数据库云管、智能问答/运维助手/问题决策；独立产品名与 GA 未核实 | SRC-XJ-IT-AGENT-001 |
| ManageEngine | Zia / OpManager Nexus（CN-DOM-06） | AIOps + Agent | 厂商官方博客描述 Zia、本地模型、私有化与 AI 不另收费；属于厂商营销材料，不是独立横评 | SRC-ME-AIOPS-GUIDE-001 |

## 商业字段证据卡

| claim_id / 产品 | 状态 | 区域 | 许可/计费单位 | 最低消费 / 超额 | 数据驻留 | 导出 / 退出 |
| --- | --- | --- | --- | --- | --- | --- |
| ALI-01 官方目录 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| ALI-02、ALI-04 AgentRun | 未核实 | 未核实；页面出现 `cn-hangzhou` 链接，不等于区域清单 | 未核实 | 文档描述缩容到 0、浅休眠计费；具体价格/超额未核实 | 文档宣称 VPC/IDC、PrivateLink、核心数据私有化；具体配置与承诺未核实 | 未核实 |
| ALI-03 Agent Sandbox | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| ALI-05 AgentBay | 未核实 | 产品页宣称部署于 Singapore；完整区域未核实 | 页面显示 Basic package 与积分试用；正式计费单位未核实 | 新用户 100 points coupon；最低消费/超额未核实 | 未核实 | 未核实 |
| ALI-06 AgentScope |  Experimental 功能不视为 GA；项目整体商业状态未核实 | 不适用/未核实 | 项目 README 称 Apache-2.0；服务条款另核 | 不适用/未核实 | 不适用/未核实 | 代码许可与可迁移性须按仓库版本另核 |
| CN-HW-01 MindOps | 官方发布页；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-HW-02 AEI | 2026 官方白皮书；商业产品状态未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-HW-03 AgentArts | 官方文档/控制台入口；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-HW-04 iMasterCloud | 官方产品文档；整体 GA 未核实 | 乾坤一/二；CloudCampus 全国一/二/三、华东、华中、西南 | 未核实 | 未核实 | 官方文档称运维数据可上云；具体地域与隔离未核实 | WORD/PPT 报告与个人信息可导出；注销后数据处理见文档，完整业务导出未核实 |
| CN-HW-05 iMaster NCE | 官方产品页；整体 GA 未核实 | 官方称 120+ 国家部署；非可用区清单 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-HW-06 算小维 | 官方视频第一代展示；商用状态未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-BD-02 千帆 Agent Infra | 官方发布说明；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-BD-03 百度搭子 | 官方页面提供体验入口；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 私有化页面宣称数据不出域；具体配置未核实 | 未核实 |
| CN-BD-04 百度伐谋 | 官方页面提供多版本入口；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 私有化页面宣称数据、任务与结果内部流转 | 未核实 |
| CN-BD-05 百度胜算 | 官方产品/版本文档；整体 GA 未核实 | 版本文档列保定/北京/成都/苏州/广州；区域不通用 | 标准/专业/旗舰版，包年包月 | 具体价格未核实 | 官方称私有化数据不出内网；公有云细节未核实 | 到期数据保留 7 天后删除；完整导出未核实 |
| CN-BD-07 Hogee | 官方计费文档；整体 GA 未核实 | 未核实 | 订阅套餐+积分；文档列个人/企业价格 | 超额规则未核实 | 隐私政策以境内处理为原则，有境外例外 | 注销后删除或匿名化；完整导出未核实 |
| CN-BD-08 文心快码 | 官方产品/定价文档；整体 GA 未核实 | 官方称中国境内 | 个人免费起；企业按人月；私有化询价 | 配额与超额未核实 | 官方称私有化数据不出边界 | 注销后 30 天内删除；完整导出未核实 |
| CN-BD-09 百度一镜 | 官方 API 产品页；整体 GA 未核实 | 未核实 | SaaS/PaaS 购买入口；具体价格未核实 | 未核实 | 未核实 | 未核实 |
| CN-BD-06 秒哒 | 公有云文档；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 多数新应用可导出源码；旧应用不支持，复杂应用需二次开发 |
| ALI-14 Model Studio | 官方文档；安全高级防护截至 2026-09 限时免费，正式计费前至少提前 1 个月通知 | 价格页列北京/新加坡/弗吉尼亚等；完整清单未核实 | 模型服务按量；Agent 安全高级防护正式计费后 ¥0.42/运行席位·小时 + 超额 ¥0.0015/Credit；默认防护免费 | 每席位每日独立 300 Credits、24 小时有效不结转；超额按实际用量 | 未核实 | 未核实 |
| ALI-15 Qoder Cloud Agents | 商业计费文档；整体 GA 未核实 | 未核实 | 个人 Credits 预付；企业资源包；模型/沙箱按用量 | 具体套餐与最低消费未核实 | 未核实 | 未核实 |
| ALI-17 Agentic OS | 官方镜像文档；商业 SLA 未核实 | 未核实 | 镜像免费；计算/存储/模型等资源另计 | 未核实 | 未核实 | 核心组件开源；完整退出流程未核实 |
| CN-TX-05 ADP | 官方产品页；整体 GA 未核实 | 未核实 | 云部署/私有化 License；私有化在客户 TKE | 未核实 | 未核实 | 未核实 |
| CN-TX-06 TCOP | AI 工作台免费公测；整体未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-OT-01 智能运维助手 | 公测 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-OT-02 HiAgent | 官方产品页；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 官方称支持私有化、数据不出域 | 未核实 |
| CN-OT-03 火山方舟 | 官方计费文档；整体平台状态未核实 | 未核实 | 实时/批量推理按 token 后付费 | 不调用不计费；配额规则未核实 | 未核实 | 文件输入支持用户 TOS；整体退出未核实 |
| CN-OT-05 移动云运维智能体 | 官方文档；仅专属集群支持 | 未核实 | 未核实；须实名政企主账号 | 未核实 | 未核实 | 历史记录可删；完整导出未核实 |
| CN-OT-04 京东云 AIOps | 历史技术文章；当前 SKU/GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-OT-06 云海 InCloud Manager | 官方产品页；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-DOM-02 云智慧 ITSM | 官方产品页；整体 GA 未核实 | 未核实 | SaaS 订阅/私有化租赁；具体价格未核实 | 未核实 | 未核实 | 未核实 |
| CN-DOM-03 夏洛克 AIOps | 官方页面；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 信创适配为厂商自述 | 未核实 |
| CN-DOM-04 炎龙 SREAgent | 官方企业版 V4.17.1；整体 GA 未核实 | 未核实 | 未核实 | 未核实 | 官方宣称私有部署数据不出域 | 未核实 |
| CN-DOM-05 新炬 IT 运维智能体 | 官方新闻；独立产品名/GA 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |
| CN-DOM-06 ManageEngine | 厂商博客；整体 GA 未核实 | 未核实 | 官方称 AI 功能不另收费；基础许可未核实 | 30 天试用；最低消费未核实 | 官方称支持本地/国内云；具体配置未核实 | 未核实 |
| ALI-16、CN-TX-01–04、CN-BD-01、CN-DOM-01 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 | 未核实 |

## 选型提示

- **云上为主**：优先云厂商自带的 AIOps/Agent；跨云/混合云另做数据面与权限验证。
- **信创/私有化**：确认模型、数据、部署与审计是否满足要求，不把“支持私有化”的宣传当成配置证明。
- **Agent 平台 vs AIOps 产品**：平台提供“造 Agent”的能力，AIOps 产品提供现成场景；两者不能按同一维度直接排名。
- **证据**：公开报道只作线索；采购前要求官方文档、逐功能状态、区域/定价页、POC 与真实客户案例。

## 来源与核实

最后核实：**2026-11-25**；复核截止：**2027-02-22**。本页官方文档与公开报道分列；无法取得正文的字段均为“未核实”。完整清单见[来源注册表](../appendix/source-registry)与[参考资料](../appendix/references)。

下一篇：[可观测与 AIOps](./observability-aiops)
