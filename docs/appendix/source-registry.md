---
title: 来源注册表
description: 厂商能力 claim 与可复核来源的稳定回指、访问时间、复核期限和快照说明。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 附录：来源注册表

> 最后核实：**2026-11-25**；复核截止：**2027-02-25**。机器可读版本见仓库 `sources/registry.yaml`。

## 使用规则

- 产品表使用稳定 `claim_id`，再回指本表的 `source_id`；例如 `GC-AWS-01 → SRC-AWS-DEVOPS-001`。
- `official_doc` 包括官方文档和官方产品页，**官方营销页不等于生产能力证明**。它最多证明“厂商如此宣称”，不能单独证明 SLA、客户规模、区域可用性、节省比例或生产效果。
- `official_release` 用于可定位的官方发布；`public_report` 是报道或转载；`community` 是项目仓库、社区文档或第三方材料。后三类不能自动升级为官方事实。
- “未核实”表示本轮没有取得足以支持该字段的证据，**不等于否定**。不得据此猜测 GA/预览、区域、价格、数据驻留或退出条款。
- 动态目录数量只在明确快照日时使用。本轮删除“36 Agent / 328 Skills”的当前事实表述，且**未重新计数**。
- `accessed_at` 是实际访问或沿用原书访问记录的日期；`review_by` 是下一次复核截止，不是来源失效日。
- 快照列记录本地正文快照与 SHA-256。本轮已保存 9 个关键官方来源；Azure SRE Agent 返回 503、MCP 官方站 SSL 握手失败，两项待重试。临时 WebFetch 文件不是永久证据。

## 来源清单

| source_id | 类型 | 访问日 | review_by | 适用 claim | 快照说明 |
| --- | --- | --- | --- | --- | --- |
| SRC-ALI-CATALOG-001 | official_doc | 2026-11-12 | 2027-02-10 | ALI-01 | 目录入口；未重计数；待存目录快照 |
| SRC-ALI-AGENTRUN-001 | official_doc | 2026-11-25 | 2027-02-25 | ALI-02、ALI-04 | 已存 `reports/sources/snapshots/SRC-ALI-AGENTRUN-001.txt` |
| SRC-ALI-SANDBOX-001 | official_doc | 2026-11-25 | 2027-02-25 | ALI-03 | 帮助中心入口；待存正文 |
| SRC-ALI-AGENTBAY-001 | official_doc | 2026-11-25 | 2027-02-25 | ALI-05 | canonical 产品页已提取；待存 |
| COM-AGENTSCOPE-001 | community | 2026-11-25 | 2027-02-25 | ALI-06 | README 已提取；待存 release/commit |
| COM-QWEN-AGENT-001 | community | 2026-11-25 | 2027-02-25 | ALI-07 | README 已提取；待存 release/commit |
| COM-SPRING-AI-ALIBABA-001 | community | 2026-11-25 | 2027-02-25 | ALI-08 | canonical 项目站已提取；待存 |
| PUB-ALI-SUMMIT-001 | public_report | 2026-11-12 | 2027-02-10 | ALI-09–11、ALI-16 | 沿用原书入口；正文待独立复核 |
| SRC-AWS-DEVOPS-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-AWS-01 | 已存 `reports/sources/snapshots/SRC-AWS-DEVOPS-001.txt` |
| SRC-AWS-QDEV-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-AWS-02 | IDE 停服提示已提取；待存 |
| SRC-AWS-AGENTCORE-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-AWS-04 | 官方文档已提取；待存 |
| SRC-AWS-QUICK-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-AWS-05 | 价格页时点值已提取；待存 |
| SRC-MS-SRE-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-MS-01 | 2026-11-25 抓取返回 503；快照待重试 |
| SRC-MS-COPILOT-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-MS-02 | 官方产品页已提取；待存 |
| SRC-MS-COPILOT-DOC-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-MS-02 | Learn 正文已提取；待存 |
| SRC-MS-FOUNDRY-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-MS-04 | 官方产品页已提取；待存 |
| SRC-GH-COPILOT-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-MS-05 | 官方产品页已提取；待存 |
| SRC-IBM-CONCERT-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-IBM-01 | 官方产品页已提取；待存 |
| SRC-IBM-INSTANA-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-IBM-02 | 官方产品页已提取；待存 |
| SRC-IBM-ORCH-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-IBM-03 | 官方产品页已提取；待存 |
| SRC-IBM-TURBO-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-IBM-04 | 官方产品页已提取；待存 |
| SRC-IBM-QRADAR-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-IBM-05、SEC-07 | 官方产品页已提取；待存 |
| SRC-DD-AI-001 | official_doc | 2026-11-25 | 2027-02-25 | OBS-01 | 已存 `reports/sources/snapshots/SRC-DD-AI-001.txt` |
| SRC-NR-AI-001 | official_doc | 2026-11-25 | 2027-02-25 | OBS-03 | 正文已提取；待存 |
| SRC-GRAFANA-ASSIST-001 | official_doc | 2026-11-25 | 2027-02-25 | OBS-07 | 官方文档已提取；待存 |
| SRC-ELASTIC-AI-001 | official_doc | 2026-11-25 | 2027-02-25 | OBS-08 | 状态与费用正文已提取；待存 |
| SRC-SCIENCELOGIC-SKYLAR-001 | official_doc | 2026-11-25 | 2027-02-25 | OBS-09 | canonical 正文已提取；待存 |
| SRC-SF-AGENTFORCE-001 | official_doc | 2026-11-25 | 2027-02-25 | GC-SF-01 | 官方产品页已提取；待存 |
| SRC-CS-CHARLOTTE-001 | official_doc | 2026-11-25 | 2027-02-25 | SEC-04 | 治理与 credits 正文已提取；待存 |
| SRC-PAN-CORTEX-001 | official_doc | 2026-11-25 | 2027-02-25 | SEC-03 | 仅核验平台入口；待存 |
| SRC-IBM-CLOUDABILITY-001 | official_doc | 2026-11-25 | 2027-02-25 | FIN-01 | 功能正文已提取；待存 |
| PUB-AWS-DEVOPS-INFOQ-001 | public_report | 2026-11-12 | 2027-02-10 | 无确定性 claim | 沿用入口；正文待复核 |
| PUB-HUAWEI-MINDOPS-001 | public_report | 2026-11-12 | 2027-02-10 | CN-HW-01、VERT-01 | 沿用入口；正文待复核 |
| PUB-HUAWEI-AEI-001 | public_report | 2026-11-12 | 2027-02-10 | CN-HW-02 | 沿用入口；正文待复核 |
| PUB-TENCENT-CLOUDQ-001 | public_report | 2026-11-12 | 2027-02-10 | CN-TX-01–04、VERT-02 | 沿用入口；正文待复核 |
| PUB-BAIDU-INDUSTRY-001 | public_report | 2026-11-12 | 2027-02-10 | CN-BD-01、CN-BD-02、VERT-03 | 沿用入口；正文待复核 |
| PUB-CHINA-TOP10-001 | public_report | 2026-11-12 | 2027-02-10 | CN-DOM-01 | 仅导航；正文待复核 |
| PUB-OPS-WHITEPAPER-001 | public_report | 2026-11-12 | 2027-02-10 | VERT-04 | 转载入口；正文待复核 |
| COM-SERVICENOW-AGENTS-001 | community | 2026-11-12 | 2027-02-10 | 无确定性 claim | 本轮未取得正文；仅导航 |
| PUB-DD-DYNATRACE-COMPARE-001 | public_report | 2026-11-12 | 2027-02-10 | 无确定性 claim | 第三方比较；仅导航 |
| SRC-MCP-001 | official_doc | 2026-11-25 | 2027-02-25 | PROTO-01 | 官方站 SSL 握手失败；快照待重试 |
| SRC-A2A-001 | official_doc | 2026-11-25 | 2027-02-25 | PROTO-02 | 已存 `reports/sources/snapshots/SRC-A2A-001.txt` |
| SRC-OWASP-GENAI-001 | official_doc | 2026-11-12 | 2027-02-10 | METH-01 | 已存 `reports/sources/snapshots/SRC-OWASP-GENAI-001.txt` |
| SRC-NIST-AIRMF-001 | official_doc | 2026-11-12 | 2027-02-10 | METH-02 | 已存 `reports/sources/snapshots/SRC-NIST-AIRMF-001.txt` |
| SRC-ISO42001-001 | official_doc | 2026-11-12 | 2027-02-10 | METH-03 | 标准目录；待存 |
| SRC-EU-AIACT-001 | official_doc | 2026-11-12 | 2027-02-10 | METH-04 | 已存 `reports/sources/snapshots/SRC-EU-AIACT-001.txt` |
| SRC-OTEL-GENAI-001 | official_doc | 2026-11-12 | 2027-02-10 | METH-05 | 已存 `reports/sources/snapshots/SRC-OTEL-GENAI-001.txt` |
| SRC-GOOGLE-SRE-001 | official_doc | 2026-11-12 | 2027-02-10 | METH-06 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SRE-001.txt` |

## 未覆盖与快照计划

Google Cloud、Oracle、SAP、ServiceNow 产品正文，以及 Microsoft Security Copilot、Dynatrace、PagerDuty、Sumo Logic、LogicMonitor、BigPanda、OpsRamp、ManageEngine、SolarWinds、Cisco、Juniper、SentinelOne、Kubecost 等条目，本轮未取得足以核验的官方正文，相关能力与商业字段统一记为“未核实”。

本轮已保存 AWS DevOps Agent、AgentRun、Datadog AI、OWASP、NIST AI RMF、EU AI Act、OTel GenAI、Google SRE Workbook 与 A2A 正文快照。Azure SRE Agent 与 MCP 待重试；其余来源按采购/发布优先级补存。社区来源还需记录 commit SHA。

完整引用入口见[参考资料](./references)。
