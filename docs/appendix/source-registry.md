---
title: 来源注册表
description: 厂商能力 claim 与可复核来源的稳定回指、访问时间、复核期限和快照说明。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 附录：来源注册表

> 注册表更新：**2026-11-25**；各来源的访问日与复核截止见下表。机器可读版本见仓库 `sources/registry.yaml`。

## 使用规则

- 产品表使用稳定 `claim_id`，再回指本表的 `source_id`；例如 `GC-AWS-01 → SRC-AWS-DEVOPS-001`。
- `official_doc` 包括官方文档和官方产品页，**官方营销页不等于生产能力证明**。它最多证明“厂商如此宣称”，不能单独证明 SLA、客户规模、区域可用性、节省比例或生产效果。
- `official_release` 用于可定位的官方发布；`public_report` 是报道或转载；`community` 是项目仓库、社区文档或第三方材料。后三类不能自动升级为官方事实。
- “未核实”表示本轮没有取得足以支持该字段的证据，**不等于否定**。不得据此猜测 GA/预览、区域、价格、数据驻留或退出条款。
- 动态目录数量只在明确快照日时使用。本轮删除“36 Agent / 328 Skills”的当前事实表述，且**未重新计数**。
- `accessed_at` 是实际访问或沿用原书访问记录的日期；`review_by` 是下一次复核截止，不是来源失效日。
- 快照列记录本地正文快照与 SHA-256。本轮已保存 95 个关键官方来源；Azure SRE Agent 返回 503、MCP 官方站 SSL 握手失败，两项待重试。临时 WebFetch 文件不是永久证据。
- 所有至少有一个“未核实”字段的厂商 claim 同时登记在机器可读的 `sources/claim-gaps.json`；补证只关闭有来源的字段，不能把整条 claim 一键改成已核实。

## 来源清单
| source_id | 类型 | 访问日 | review_by | 适用 claim | 快照说明 |
| --- | --- | --- | --- | --- | --- |
| SRC-ALI-CATALOG-001 | official_doc | 2026-11-12 | 2027-02-10 | ALI-01 | 目录入口；未重计数；待存目录快照 |
| SRC-ALI-AGENTRUN-001 | official_doc | 2026-11-25 | 2027-02-22 | ALI-02、ALI-04 | 已存 `reports/sources/snapshots/SRC-ALI-AGENTRUN-001.txt` |
| SRC-ALI-SANDBOX-001 | official_doc | 2026-11-24 | 2027-02-22 | ALI-03 | 帮助中心入口；待存正文 |
| SRC-ALI-AGENTBAY-001 | official_doc | 2026-11-24 | 2027-02-22 | ALI-05 | canonical 产品页已提取；待存 |
| COM-AGENTSCOPE-001 | community | 2026-11-24 | 2027-02-22 | ALI-06 | README 已提取；待存 release/commit |
| COM-QWEN-AGENT-001 | community | 2026-11-24 | 2027-02-22 | ALI-07 | README 已提取；待存 release/commit |
| COM-SPRING-AI-ALIBABA-001 | community | 2026-11-24 | 2027-02-22 | ALI-08 | canonical 项目站已提取；待存 |
| PUB-ALI-SUMMIT-001 | public_report | 2026-11-12 | 2027-02-10 | ALI-09–11、ALI-16 | 沿用原书入口；正文待独立复核 |
| SRC-AWS-DEVOPS-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-AWS-01 | 已存 `reports/sources/snapshots/SRC-AWS-DEVOPS-001.txt` |
| SRC-AWS-QDEV-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-AWS-02 | IDE 停服提示已提取；待存 |
| SRC-AWS-AGENTCORE-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-AWS-04 | 官方文档已提取；待存 |
| SRC-AWS-QUICK-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-AWS-05 | 价格页时点值已提取；待存 |
| SRC-MS-SRE-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-MS-01 | 2026-11-25 抓取返回 503；快照待重试 |
| SRC-MS-COPILOT-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-MS-02 | 官方产品页已提取；待存 |
| SRC-MS-COPILOT-DOC-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-MS-02 | Learn 正文已提取；待存 |
| SRC-MS-FOUNDRY-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-MS-04 | 官方产品页已提取；待存 |
| SRC-GH-COPILOT-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-MS-05 | 官方产品页已提取；待存 |
| SRC-IBM-CONCERT-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-IBM-01 | 官方产品页已提取；待存 |
| SRC-IBM-INSTANA-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-IBM-02 | 官方产品页已提取；待存 |
| SRC-IBM-ORCH-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-IBM-03 | 官方产品页已提取；待存 |
| SRC-IBM-TURBO-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-IBM-04 | 官方产品页已提取；待存 |
| SRC-IBM-QRADAR-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-IBM-05、SEC-07 | 官方产品页已提取；待存 |
| SRC-DD-AI-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-01 | 已存 `reports/sources/snapshots/SRC-DD-AI-001.txt` |
| SRC-NR-AI-001 | official_doc | 2026-11-24 | 2027-02-22 | OBS-03 | 正文已提取；待存 |
| SRC-GRAFANA-ASSIST-001 | official_doc | 2026-11-24 | 2027-02-22 | OBS-07 | 官方文档已提取；待存 |
| SRC-ELASTIC-AI-001 | official_doc | 2026-11-24 | 2027-02-22 | OBS-08 | 状态与费用正文已提取；待存 |
| SRC-SCIENCELOGIC-SKYLAR-001 | official_doc | 2026-11-24 | 2027-02-22 | OBS-09 | canonical 正文已提取；待存 |
| SRC-SF-AGENTFORCE-001 | official_doc | 2026-11-24 | 2027-02-22 | GC-SF-01 | 官方产品页已提取；待存 |
| SRC-CS-CHARLOTTE-001 | official_doc | 2026-11-24 | 2027-02-22 | SEC-04 | 治理与 credits 正文已提取；待存 |
| SRC-PAN-CORTEX-001 | official_doc | 2026-11-24 | 2027-02-22 | SEC-03 | 仅核验平台入口；待存 |
| SRC-IBM-CLOUDABILITY-001 | official_doc | 2026-11-24 | 2027-02-22 | FIN-01 | 功能正文已提取；待存 |
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
| SRC-OWASP-GENAI-001 | official_doc | 2026-11-25 | 2027-02-10 | METH-01 | 已存 `reports/sources/snapshots/SRC-OWASP-GENAI-001.txt` |
| SRC-NIST-AIRMF-001 | official_doc | 2026-11-25 | 2027-02-10 | METH-02 | 已存 `reports/sources/snapshots/SRC-NIST-AIRMF-001.txt` |
| SRC-ISO42001-001 | official_doc | 2026-11-12 | 2027-02-10 | METH-03 | 标准目录；待存 |
| SRC-EU-AIACT-001 | official_doc | 2026-11-25 | 2027-02-10 | METH-04 | 已存 `reports/sources/snapshots/SRC-EU-AIACT-001.txt` |
| SRC-OTEL-GENAI-001 | official_doc | 2026-11-25 | 2027-02-10 | METH-05 | 已存 `reports/sources/snapshots/SRC-OTEL-GENAI-001.txt` |
| SRC-GOOGLE-SRE-001 | official_doc | 2026-11-25 | 2027-02-10 | METH-06 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SRE-001.txt` |
| SRC-HW-AGENTARTS-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-03 | 已存 `reports/sources/snapshots/SRC-HW-AGENTARTS-001.txt` |
| SRC-BD-DUMATE-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-03 | 已存 `reports/sources/snapshots/SRC-BD-DUMATE-001.txt` |
| SRC-BD-FAMOU-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-04 | 已存 `reports/sources/snapshots/SRC-BD-FAMOU-001.txt` |
| SRC-BD-MIAODA-EXPORT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-06 | 已存 `reports/sources/snapshots/SRC-BD-MIAODA-EXPORT-001.txt` |
| SRC-OR-ENTERPRISE-AGENTS-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-OR-01 | 已存 `reports/sources/snapshots/SRC-OR-ENTERPRISE-AGENTS-001.txt` |
| SRC-SAP-JOULE-AGENTS-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-SAP-02 | 已存 `reports/sources/snapshots/SRC-SAP-JOULE-AGENTS-001.txt` |
| SRC-SN-AI-AGENTS-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-SN-01 | 已存 `reports/sources/snapshots/SRC-SN-AI-AGENTS-001.txt` |
| SRC-ALI-MODELSTUDIO-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | ALI-14 | 已存 `reports/sources/snapshots/SRC-ALI-MODELSTUDIO-PRICING-001.txt` |
| SRC-QODER-CLOUDAGENTS-BILLING-001 | official_doc | 2026-11-25 | 2027-02-22 | ALI-15 | 已存 `reports/sources/snapshots/SRC-QODER-CLOUDAGENTS-BILLING-001.txt` |
| SRC-ALI-AGENTICOS-001 | official_doc | 2026-11-25 | 2027-02-22 | ALI-17 | 已存 `reports/sources/snapshots/SRC-ALI-AGENTICOS-001.txt` |
| SRC-TX-ADP-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-TX-05 | 已存 `reports/sources/snapshots/SRC-TX-ADP-001.txt` |
| SRC-TX-TCOP-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-TX-06 | 已存 `reports/sources/snapshots/SRC-TX-TCOP-001.txt` |
| SRC-VOLC-OPSASSISTANT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-OT-01 | 已存 `reports/sources/snapshots/SRC-VOLC-OPSASSISTANT-001.txt` |
| SRC-VOLC-ARK-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-OT-03 | 已存 `reports/sources/snapshots/SRC-VOLC-ARK-PRICING-001.txt` |
| SRC-GO-GEMINI-AGENT-001 | official_release | 2026-11-25 | 2027-02-22 | GC-GO-02 | 已存 `reports/sources/snapshots/SRC-GO-GEMINI-AGENT-001.txt` |
| SRC-GO-ADK-V2-001 | official_release | 2026-11-25 | 2027-02-22 | GC-GO-06 | 已存 `reports/sources/snapshots/SRC-GO-ADK-V2-001.txt` |
| SRC-MS-SECCOPILOT-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-MS-03 | 已存 `reports/sources/snapshots/SRC-MS-SECCOPILOT-PRICING-001.txt` |
| SRC-JD-AIOPS-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-OT-04 | 已存 `reports/sources/snapshots/SRC-JD-AIOPS-001.txt` |
| SRC-INSPUR-INCLOUD-MANAGER-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-OT-06 | 已存 `reports/sources/snapshots/SRC-INSPUR-INCLOUD-MANAGER-001.txt` |
| SRC-CLOUDWISE-ITSM-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-DOM-02 | 已存 `reports/sources/snapshots/SRC-CLOUDWISE-ITSM-001.txt` |
| SRC-EOITEK-AIOPS-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-DOM-03 | 已存 `reports/sources/snapshots/SRC-EOITEK-AIOPS-001.txt` |
| SRC-YANLONG-SREAGENT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-DOM-04 | 已存 `reports/sources/snapshots/SRC-YANLONG-SREAGENT-001.txt` |
| SRC-XJ-IT-AGENT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-DOM-05 | 已存 `reports/sources/snapshots/SRC-XJ-IT-AGENT-001.txt` |
| SRC-ME-AIOPS-GUIDE-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-DOM-06、OBS-15 | 已存 `reports/sources/snapshots/SRC-ME-AIOPS-GUIDE-001.txt` |
| SRC-HW-MINDOPS-001 | official_release | 2026-11-25 | 2027-02-22 | CN-HW-01 | 已存 `reports/sources/snapshots/SRC-HW-MINDOPS-001.txt` |
| SRC-HW-AEI-2026-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-02 | 已存 `reports/sources/snapshots/SRC-HW-AEI-2026-001.txt` |
| SRC-HW-IMASTERCLOUD-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-04 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-001.txt` |
| SRC-HW-IMASTERCLOUD-DATA-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-04 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-DATA-001.txt` |
| SRC-HW-IMASTERCLOUD-REGIONS-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-04 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-REGIONS-001.txt` |
| SRC-HW-IMASTERCLOUD-ACCOUNT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-04 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-ACCOUNT-001.txt` |
| SRC-HW-IMASTERNCE-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-05 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERNCE-001.txt` |
| SRC-BD-QIANFAN-AGENTINFRA-001 | official_release | 2026-11-25 | 2027-02-22 | CN-BD-02 | 已存 `reports/sources/snapshots/SRC-BD-QIANFAN-AGENTINFRA-001.txt` |
| SRC-BD-DATABUILDER-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-05 | 已存 `reports/sources/snapshots/SRC-BD-DATABUILDER-001.txt` |
| SRC-BD-DATABUILDER-VERSIONS-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-05 | 已存 `reports/sources/snapshots/SRC-BD-DATABUILDER-VERSIONS-001.txt` |
| SRC-BD-HOGEE-BILLING-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-07 | 已存 `reports/sources/snapshots/SRC-BD-HOGEE-BILLING-001.txt` |
| SRC-BD-HOGEE-PRIVACY-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-07 | 已存 `reports/sources/snapshots/SRC-BD-HOGEE-PRIVACY-001.txt` |
| SRC-BD-COMATE-PRODUCT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-08 | 已存 `reports/sources/snapshots/SRC-BD-COMATE-PRODUCT-001.txt` |
| SRC-BD-COMATE-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-08 | 已存 `reports/sources/snapshots/SRC-BD-COMATE-PRICING-001.txt` |
| SRC-BD-COMATE-DATA-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-08 | 已存 `reports/sources/snapshots/SRC-BD-COMATE-DATA-001.txt` |
| SRC-BD-YIJING-API-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-BD-09 | 已存 `reports/sources/snapshots/SRC-BD-YIJING-API-001.txt` |
| SRC-SW-OBS-2026-1-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-16 | 已存 `reports/sources/snapshots/SRC-SW-OBS-2026-1-001.txt` |
| SRC-HOLMESGPT-001 | community | 2026-11-25 | 2027-02-22 | OBS-18 | 已存 `reports/sources/snapshots/SRC-HOLMESGPT-001.txt` |
| SRC-K8SGPT-001 | community | 2026-11-25 | 2027-02-22 | OBS-19 | 已存 `reports/sources/snapshots/SRC-K8SGPT-001.txt` |
| SRC-INCIDENTIO-AISRE-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-20 | 已存 `reports/sources/snapshots/SRC-INCIDENTIO-AISRE-001.txt` |
| SRC-ROOTLY-AISRE-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-23 | 已存 `reports/sources/snapshots/SRC-ROOTLY-AISRE-001.txt` |
| SRC-RESOLVEAI-AISRE-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-24 | 已存 `reports/sources/snapshots/SRC-RESOLVEAI-AISRE-001.txt` |
| SRC-CLERIC-AISRE-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-25 | 已存 `reports/sources/snapshots/SRC-CLERIC-AISRE-001.txt` |
| SRC-CLERIC-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-25 | 已存 `reports/sources/snapshots/SRC-CLERIC-PRICING-001.txt` |
| SRC-OBSY-AGREEMENT-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-21 | 已存 `reports/sources/snapshots/SRC-OBSY-AGREEMENT-001.txt` |
| SRC-CANWAY-AGENTICOPS-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-22 | 已存 `reports/sources/snapshots/SRC-CANWAY-AGENTICOPS-001.txt` |
| SRC-CLOUDWISE-CASTREL-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-27 | 已存 `reports/sources/snapshots/SRC-CLOUDWISE-CASTREL-001.txt` |
| SRC-EOITEK-DATA-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-28 | 已存 `reports/sources/snapshots/SRC-EOITEK-DATA-001.txt` |
| SRC-YANLONG-PRIVATE-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-29 | 已存 `reports/sources/snapshots/SRC-YANLONG-PRIVATE-001.txt` |
| SRC-DD-CLOUDSRE-001 | community | 2026-11-25 | 2027-02-22 | OBS-02 | 已存 `reports/sources/snapshots/SRC-DD-CLOUDSRE-001.txt` |
| SRC-SPLUNK-AIASSISTANT-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-04 | 已存 `reports/sources/snapshots/SRC-SPLUNK-AIASSISTANT-001.txt` |
| SRC-SPLUNK-ITSI-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-04 | 已存 `reports/sources/snapshots/SRC-SPLUNK-ITSI-001.txt` |
| SRC-PD-AIAGENTS-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-05 | 已存 `reports/sources/snapshots/SRC-PD-AIAGENTS-001.txt` |
| SRC-SUMO-MOBOT-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-10 | 已存 `reports/sources/snapshots/SRC-SUMO-MOBOT-001.txt` |
| SRC-LM-EDWIN-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-11 | 已存 `reports/sources/snapshots/SRC-LM-EDWIN-001.txt` |
| SRC-BP-L1AGENT-001 | official_doc | 2026-11-25 | 2027-02-22 | OBS-12 | 已存 `reports/sources/snapshots/SRC-BP-L1AGENT-001.txt` |
| SRC-AWS-CLOUDWATCH-OMNI-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-AWS-03 | 已存 `reports/sources/snapshots/SRC-AWS-CLOUDWATCH-OMNI-001.txt` |
| SRC-AWS-OMNI-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-AWS-03 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-PRICING-001.txt` |
| SRC-AWS-OMNI-SECURITY-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-AWS-03 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-SECURITY-001.txt` |
| SRC-AWS-OMNI-RETENTION-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-AWS-03 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-RETENTION-001.txt` |
| SRC-AWS-OMNI-REGIONS-001 | official_release | 2026-11-25 | 2027-02-22 | GC-AWS-03 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-REGIONS-001.txt` |
| SRC-OR-OPSINSIGHTS-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-OR-02 | 已存 `reports/sources/snapshots/SRC-OR-OPSINSIGHTS-001.txt` |
| SRC-OR-FUSION-AI-001 | official_release | 2026-11-25 | 2027-02-22 | GC-OR-03 | 已存 `reports/sources/snapshots/SRC-OR-FUSION-AI-001.txt` |
| SRC-SN-CONTROLTOWER-001 | official_doc | 2026-11-25 | 2027-02-22 | GC-SN-02 | 已存 `reports/sources/snapshots/SRC-SN-CONTROLTOWER-001.txt` |
| SRC-ALI-QODER-CN-001 | official_doc | 2026-11-25 | 2027-02-22 | ALI-18 | 已存 `reports/sources/snapshots/SRC-ALI-QODER-CN-001.txt` |
| SRC-ALI-QODER-CN-BILLING-001 | official_doc | 2026-11-25 | 2027-02-22 | ALI-18 | 已存 `reports/sources/snapshots/SRC-ALI-QODER-CN-BILLING-001.txt` |
| SRC-ALI-QODERWORK-CN-001 | official_doc | 2026-11-25 | 2027-02-22 | ALI-18 | 已存 `reports/sources/snapshots/SRC-ALI-QODERWORK-CN-001.txt` |
| SRC-HW-CCAE-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-HW-06 | 已存 `reports/sources/snapshots/SRC-HW-CCAE-001.txt` |
| SRC-HW-SUANXIAOWEI-001 | community | 2026-11-25 | 2027-02-22 | CN-HW-06 | 已存 `reports/sources/snapshots/SRC-HW-SUANXIAOWEI-001.txt` |
| SRC-VOLC-HIAGENT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-OT-02 | 已存 `reports/sources/snapshots/SRC-VOLC-HIAGENT-001.txt` |
| SRC-CMCC-OPSAGENT-001 | official_doc | 2026-11-25 | 2027-02-22 | CN-OT-05 | 已存 `reports/sources/snapshots/SRC-CMCC-OPSAGENT-001.txt` |
| SRC-MS-SECCOPILOT-COMPLIANCE-001 | official_doc | 2026-11-25 | 2027-02-22 | SEC-01 | 已存 `reports/sources/snapshots/SRC-MS-SECCOPILOT-COMPLIANCE-001.txt` |
| SRC-DROPZONE-AISOC-001 | official_doc | 2026-11-25 | 2027-02-22 | SEC-08 | 已存 `reports/sources/snapshots/SRC-DROPZONE-AISOC-001.txt` |
| SRC-DROPZONE-EU-001 | official_doc | 2026-11-25 | 2027-02-22 | SEC-08 | 已存 `reports/sources/snapshots/SRC-DROPZONE-EU-001.txt` |
| SRC-DD-BITS-SECURITY-001 | official_release | 2026-11-25 | 2027-02-22 | SEC-09 | 已存 `reports/sources/snapshots/SRC-DD-BITS-SECURITY-001.txt` |
| SRC-HARNESS-CCM-001 | official_doc | 2026-11-25 | 2027-02-22 | FIN-03 | 已存 `reports/sources/snapshots/SRC-HARNESS-CCM-001.txt` |
| SRC-APPTIO-KUBECOST-001 | official_doc | 2026-11-25 | 2027-02-22 | FIN-04 | 已存 `reports/sources/snapshots/SRC-APPTIO-KUBECOST-001.txt` |
| SRC-VANTAGE-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | FIN-06 | 已存 `reports/sources/snapshots/SRC-VANTAGE-PRICING-001.txt` |
| SRC-CLOUDZERO-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | FIN-07 | 已存 `reports/sources/snapshots/SRC-CLOUDZERO-PRICING-001.txt` |
| SRC-CLOUDZERO-API-001 | official_doc | 2026-11-25 | 2027-02-22 | FIN-07 | 已存 `reports/sources/snapshots/SRC-CLOUDZERO-API-001.txt` |
| SRC-FINOUT-PRICING-001 | official_doc | 2026-11-25 | 2027-02-22 | FIN-08 | 已存 `reports/sources/snapshots/SRC-FINOUT-PRICING-001.txt` |
| SRC-FLEXERA-CCO-001 | official_doc | 2026-11-25 | 2027-02-22 | FIN-09 | 已存 `reports/sources/snapshots/SRC-FLEXERA-CCO-001.txt` |

## 未覆盖与快照计划

Gemini Cloud Assist、Gemini Enterprise、Google Security Operations、Gemini Code Assist、SAP Joule Work、HPE OpsRamp、BMC HelixGPT、Komodor、Metoro、SentinelOne Purple AI、Splunk Security AI、Broadcom CloudHealth，以及 Cisco、Juniper 等条目仍缺足够可归档正文。Oracle、SAP、ServiceNow、华为/百度/阿里/腾讯/火山、Dynatrace、Splunk、PagerDuty、Sumo Logic、LogicMonitor、BigPanda、SolarWinds、HolmesGPT、K8sGPT、incident.io、Rootly、Resolve.ai、Cleric、观测云及部分国产 AIOps 厂商已有官方来源；Google Gemini agent、ADK 与 Microsoft Security Copilot 也已补证，但区域、许可、驻留与退出字段仍按 claim 逐项保留“未核实”。

本轮已保存 AWS DevOps Agent、AgentRun、Datadog AI、OWASP、NIST AI RMF、EU AI Act、OTel GenAI、Google SRE Workbook、A2A，以及 AgentArts、百度搭子、百度伐谋、秒哒导出、OCI Enterprise AI Agents、SAP Joule Agents、ServiceNow AI Agents、Model Studio 价格、Qoder 计费、Agentic OS、腾讯 ADP/TCOP、火山智能运维助手/方舟计费、Gemini agent、ADK v2.0、Security Copilot 定价，以及京东云 AIOps、浪潮 InCloud Manager、云智慧 ITSM、擎创夏洛克、炎龙 SREAgent、新炬 IT 运维智能体、ManageEngine AIOps 指南、MindOps、AEI 白皮书、iMasterCloud/NCE、百度胜算/Hogee/文心快码/一镜、SolarWinds、HolmesGPT、K8sGPT、incident.io/Rootly/Resolve.ai/Cleric、观测云、嘉为蓝鲸、云智慧 Castrel、擎创数据中台与炎龙私有化安全说明，以及 CloudWatch Omni、OCI Ops Insights/Fusion AI、ServiceNow Control Tower、Qoder CN、算小维、HiAgent、移动云运维智能体、Security Copilot、DropZone、Datadog Bits Security、Harness CCM、Kubecost、Vantage、CloudZero、Finout、Flexera 正文快照。Azure SRE Agent 与 MCP 待重试；其余来源按采购/发布优先级补存。社区来源还需记录 commit SHA。

完整引用入口见[参考资料](./references)。
