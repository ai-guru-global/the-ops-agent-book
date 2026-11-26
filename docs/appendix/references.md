---
title: 参考资料
description: 由来源注册表生成的厂商、标准与协议引用，以及 K8s、RDMA、GPU 与 Agent 工程延伸阅读。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 附录：参考资料

> 本页最后核实：**2026-11-25**；各来源的复核截止见下表。产品能力、计费与文档会变化，使用前请以官方最新页面为准。

## 来源 ID 与 claim 回指

厂商页和阿里附录中的可核验能力使用稳定 `claim_id → source_id`。例如 `GC-AWS-01 → SRC-AWS-DEVOPS-001`、`ALI-02 → SRC-ALI-AGENTRUN-001`、`OBS-08 → SRC-ELASTIC-AI-001`。机器可读字段见仓库 `sources/registry.yaml`；阅读版见[来源注册表](./source-registry)。

- `official_doc`：官方文档或官方产品页；营销页只证明“厂商如此宣称”，不等于生产能力、SLA、客户规模、区域或商业条款证明。
- `official_release`：可定位的官方发布；是否支持具体 claim 以注册表映射为准。
- `public_report`：公开报道/转载；必须与官方事实分开，不能自动升级。
- `community`：项目仓库、项目文档或社区材料；“production-ready”等自述不是独立生产验证。
- “未核实”表示本轮没有足够证据，**不等于否定**；不得猜测 GA/预览、区域、价格、驻留或退出条款。
- 动态目录数量只在明确快照日使用。本轮删除“36 Agent / 328 Skills”的当前事实表述，且未重新计数。

<!-- BEGIN GENERATED REFERENCES -->
## 注册表来源（自动生成）

以下 207 条来源直接由 `sources/registry.yaml` 生成；URL、类型、claim、访问日与快照状态均不在本页手工维护。官方营销页只证明厂商宣称，不证明生产效果或采购就绪。

### 阿里 Agent 产品与生态

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| COM-AGENTSCOPE-001 | [AgentScope GitHub repository](https://github.com/agentscope-ai/agentscope) | community / ALI-06 | 2026-11-24 | 待存 / 仅入口 |
| COM-QWEN-AGENT-001 | [Qwen-Agent GitHub repository](https://github.com/QwenLM/Qwen-Agent) | community / ALI-07 | 2026-11-24 | 待存 / 仅入口 |
| COM-SPRING-AI-ALIBABA-001 | [Spring AI Alibaba project documentation](https://spring-ai-alibaba.github.io) | community / ALI-08 | 2026-11-24 | 待存 / 仅入口 |
| PUB-ALI-SUMMIT-001 | [2026 阿里云峰会 Agent Native 产品报道](https://culture.ifeng.com/c/8tPjCX8bdEh) | public_report / ALI-09、ALI-10、ALI-11、ALI-16 | 2026-11-12 | 待存 / 仅入口 |
| SRC-ALI-AGENTBAY-001 | [无影 AgentBay](https://www.alibabacloud.com/en/product/agentbay) | official_doc / ALI-05 | 2026-11-24 | 待存 / 仅入口 |
| SRC-ALI-AGENTICOS-001 | [Alibaba Cloud Linux 4 Agentic Edition 产品概览](https://help.aliyun.com/zh/alinux/agentic-os) | official_doc / ALI-17 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-AGENTICOS-001.txt` |
| SRC-ALI-AGENTRUN-001 | [AgentRun 是什么](https://help.aliyun.com/zh/agentrun/what-is-agentrun) | official_doc / ALI-02、ALI-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-AGENTRUN-001.txt` |
| SRC-ALI-CATALOG-001 | [阿里云 Agent 服务目录](https://agentcatalog.aliyun.com/) | official_doc / ALI-01 | 2026-11-12 | 待存 / 仅入口 |
| SRC-ALI-MODELSTUDIO-PRICING-001 | [大模型服务平台百炼 Model Studio 模型价格](https://help.aliyun.com/zh/model-studio/model-pricing) | official_doc / ALI-14 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-MODELSTUDIO-PRICING-001.txt` |
| SRC-ALI-QODER-CN-001 | [Qoder CN 系列](https://help.aliyun.com/zh/lingma/) | official_doc / ALI-18 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-QODER-CN-001.txt` |
| SRC-ALI-QODER-CN-BILLING-001 | [Qoder CN 计费说明](https://help.aliyun.com/zh/lingma/billing-description) | official_doc / ALI-18 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-QODER-CN-BILLING-001.txt` |
| SRC-ALI-QODERWORK-CN-001 | [QoderWork CN 下载与迁移说明](https://qoder.com.cn/download) | official_doc / ALI-18 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-QODERWORK-CN-001.txt` |
| SRC-ALI-SANDBOX-001 | [智能体沙箱 Agent Sandbox](https://help.aliyun.com/zh/agent-sandbox/) | official_doc / ALI-03 | 2026-11-24 | 待存 / 仅入口 |
| SRC-QODER-CLOUDAGENTS-BILLING-001 | [Qoder Cloud Agents 计费](https://docs.qoder.com/zh/cloud-agents/billing) | official_doc / ALI-15 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-QODER-CLOUDAGENTS-BILLING-001.txt` |

### 全球云厂商

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| SRC-AWS-AGENTCORE-001 | [What is Amazon Bedrock AgentCore?](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html) | official_doc / GC-AWS-04 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-AGENTCORE-001.txt` |
| SRC-AWS-AGENTCORE-GA-001 | [Amazon Bedrock AgentCore is now generally available](https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-bedrock-agentcore-available/) | official_release / GC-AWS-04 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-AGENTCORE-GA-001.txt` |
| SRC-AWS-AGENTCORE-PRICING-001 | [Amazon Bedrock AgentCore Pricing](https://aws.amazon.com/bedrock/agentcore/pricing/) | official_doc / GC-AWS-04 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-AGENTCORE-PRICING-001.txt` |
| SRC-AWS-AGENTCORE-REGIONS-001 | [Amazon Bedrock AgentCore endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/bedrock_agentcore.html) | official_doc / GC-AWS-04 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-AGENTCORE-REGIONS-001.txt` |
| SRC-AWS-CLOUDWATCH-OMNI-001 | [CloudWatch Omni](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch-omni.html) | official_doc / GC-AWS-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-AWS-CLOUDWATCH-OMNI-001.txt` |
| SRC-AWS-DEVOPS-001 | [AWS DevOps Agent](https://aws.amazon.com/devops-agent/) | official_doc / GC-AWS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-AWS-DEVOPS-001.txt` |
| SRC-AWS-DEVOPS-GA-001 | [Announcing General Availability of AWS DevOps Agent](https://aws.amazon.com/blogs/mt/announcing-general-availability-of-aws-devops-agent/) | official_release / GC-AWS-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-DEVOPS-GA-001.txt` |
| SRC-AWS-DEVOPS-PRICING-001 | [AWS DevOps Agent Pricing](https://aws.amazon.com/devops-agent/pricing/) | official_doc / GC-AWS-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-DEVOPS-PRICING-001.txt` |
| SRC-AWS-DEVOPS-REGIONS-001 | [AWS DevOps Agent Supported Regions](https://docs.aws.amazon.com/devopsagent/latest/userguide/about-aws-devops-agent-supported-regions.html) | official_doc / GC-AWS-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-DEVOPS-REGIONS-001.txt` |
| SRC-AWS-DEVOPS-SECURITY-001 | [AWS DevOps Agent Security](https://docs.aws.amazon.com/devopsagent/latest/userguide/aws-devops-agent-security.html) | official_doc / GC-AWS-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-DEVOPS-SECURITY-001.txt` |
| SRC-AWS-OMNI-PRICING-001 | [Amazon CloudWatch Omni Pricing](https://aws.amazon.com/cloudwatch/omni/pricing/) | official_doc / GC-AWS-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-PRICING-001.txt` |
| SRC-AWS-OMNI-REGIONS-001 | [CloudWatch Omni regional availability](https://aws.amazon.com/about-aws/whats-new/2026/10/amazon-cloudwatch-omni-8-regions/) | official_release / GC-AWS-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-REGIONS-001.txt` |
| SRC-AWS-OMNI-RETENTION-001 | [CloudWatch investigations data retention](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations-Retention.html) | official_doc / GC-AWS-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-RETENTION-001.txt` |
| SRC-AWS-OMNI-SECURITY-001 | [Security in CloudWatch investigations](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Investigations-Security.html) | official_doc / GC-AWS-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-AWS-OMNI-SECURITY-001.txt` |
| SRC-AWS-QDEV-001 | [What is Amazon Q Developer?](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/what-is.html) | official_doc / GC-AWS-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-QDEV-001.txt` |
| SRC-AWS-QDEV-DATA-001 | [Data storage in Amazon Q Developer](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/data-storage.html) | official_doc / GC-AWS-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-QDEV-DATA-001.txt` |
| SRC-AWS-QDEV-PRICING-001 | [Amazon Q Developer Pricing](https://aws.amazon.com/q/developer/pricing/) | official_doc / GC-AWS-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-QDEV-PRICING-001.txt` |
| SRC-AWS-QDEV-REGIONS-001 | [Amazon Q Developer Pro Region support](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/q-admin-setup-subscribe-regions.html) | official_doc / GC-AWS-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-AWS-QDEV-REGIONS-001.txt` |
| SRC-AWS-QUICK-001 | [AWS Quick](https://aws.amazon.com/quick/) | official_doc / GC-AWS-05 | 2026-11-24 | 待存 / 仅入口 |
| SRC-GH-COPILOT-001 | [GitHub Copilot](https://github.com/features/copilot) | official_doc / GC-MS-05 | 2026-11-24 | 待存 / 仅入口 |
| SRC-GO-ADK-V2-001 | [Google ADK Python v2.0.0 General Availability](https://github.com/google/adk-python/releases/tag/v2.0.0) | official_release / GC-GO-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GO-ADK-V2-001.txt` |
| SRC-GO-GEMINI-AGENT-001 | [Google Cloud launches Gemini agent](https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/gemini-at-work/) | official_release / GC-GO-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GO-GEMINI-AGENT-001.txt` |
| SRC-GOOGLE-CLOUD-ASSIST-001 | [Gemini Cloud Assist overview](https://docs.cloud.google.cn/cloud-assist/overview?hl=en) | official_doc / GC-GO-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GOOGLE-CLOUD-ASSIST-001.txt` |
| SRC-GOOGLE-CODEASSIST-SUNSET-001 | [Gemini Code Assist Standard and Enterprise subscriptions](https://docs.cloud.google.cn/gemini/docs/codeassist/sunset?hl=en) | official_doc / GC-GO-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GOOGLE-CODEASSIST-SUNSET-001.txt` |
| SRC-GOOGLE-GEMINI-ENTERPRISE-BILLING-001 | [How billing works in Gemini Enterprise](https://docs.cloud.google.cn/gemini/enterprise/docs/manage-costs-overview?hl=en) | official_doc / GC-GO-03 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-GOOGLE-GEMINI-ENTERPRISE-BILLING-001.txt` |
| SRC-GOOGLE-GEMINI-ENTERPRISE-LICENSES-001 | [Gemini Enterprise subscriptions and licenses](https://docs.cloud.google.cn/gemini/enterprise/docs/licenses?hl=en) | official_doc / GC-GO-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GOOGLE-GEMINI-ENTERPRISE-LICENSES-001.txt` |
| SRC-GOOGLE-GEMINI-ENTERPRISE-LOCATIONS-001 | [Gemini Enterprise data residency locations](https://docs.cloud.google.cn/gemini/enterprise/docs/locations?hl=en) | official_doc / GC-GO-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GOOGLE-GEMINI-ENTERPRISE-LOCATIONS-001.txt` |
| SRC-GOOGLE-GEMINI-ENTERPRISE-QUOTAS-001 | [Gemini Enterprise quotas and pay-as-you-go usage](https://docs.cloud.google.cn/gemini/enterprise/docs/quotas-and-pay-as-you-go-usage?hl=en) | official_doc / GC-GO-03 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-GOOGLE-GEMINI-ENTERPRISE-QUOTAS-001.txt` |
| SRC-GOOGLE-SECOPS-DEPROVISION-001 | [Google SecOps deprovisioning](https://docs.cloud.google.cn/chronicle/docs/onboard/customer-initiated-secops-deprovision?hl=en) | official_doc / GC-GO-04、SEC-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SECOPS-DEPROVISION-001.txt` |
| SRC-GOOGLE-SECOPS-DR-001 | [Google Security Operations SIEM disaster recovery](https://docs.cloud.google.cn/architecture/disaster-recovery?hl=en) | official_doc / GC-GO-04、SEC-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SECOPS-DR-001.txt` |
| SRC-GOOGLE-SECOPS-EXPORT-001 | [Google SecOps export to self-managed BigQuery](https://docs.cloud.google.cn/chronicle/docs/reports/export-to-customer-managed-project?hl=en) | official_doc / GC-GO-04、SEC-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SECOPS-EXPORT-001.txt` |
| SRC-GOOGLE-SECOPS-PACKAGES-001 | [Google SecOps packages overview](https://docs.cloud.google.cn/chronicle/docs/secops/secops-packages?hl=en) | official_doc / GC-GO-04、SEC-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SECOPS-PACKAGES-001.txt` |
| SRC-GOOGLE-SECOPS-QUOTAS-001 | [Google SecOps quotas and burst limits](https://docs.cloud.google.cn/chronicle/docs/ingestion/burst-limits?hl=en) | official_doc / GC-GO-04、SEC-02 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SECOPS-QUOTAS-001.txt` |
| SRC-IBM-CONCERT-001 | [IBM Concert](https://www.ibm.com/products/concert) | official_doc / GC-IBM-01 | 2026-11-24 | 待存 / 仅入口 |
| SRC-IBM-INSTANA-001 | [IBM Instana](https://www.ibm.com/products/instana) | official_doc / GC-IBM-02 | 2026-11-24 | 待存 / 仅入口 |
| SRC-IBM-ORCH-001 | [IBM watsonx Orchestrate](https://www.ibm.com/products/watsonx-orchestrate) | official_doc / GC-IBM-03 | 2026-11-24 | 待存 / 仅入口 |
| SRC-IBM-QRADAR-001 | [IBM QRadar](https://www.ibm.com/products/qradar) | official_doc / GC-IBM-05、SEC-07 | 2026-11-24 | 待存 / 仅入口 |
| SRC-IBM-TURBO-001 | [IBM Turbonomic](https://www.ibm.com/products/turbonomic) | official_doc / GC-IBM-04 | 2026-11-24 | 待存 / 仅入口 |
| SRC-MS-COPILOT-001 | [Azure Copilot](https://azure.microsoft.com/en-us/products/copilot) | official_doc / GC-MS-02 | 2026-11-24 | 待存 / 仅入口 |
| SRC-MS-COPILOT-DOC-001 | [Azure Copilot overview](https://learn.microsoft.com/en-us/azure/copilot/overview) | official_doc / GC-MS-02 | 2026-11-24 | 待存 / 仅入口 |
| SRC-MS-FOUNDRY-001 | [Microsoft Foundry](https://azure.microsoft.com/en-us/products/ai-foundry) | official_doc / GC-MS-04 | 2026-11-24 | 待存 / 仅入口 |
| SRC-MS-SECCOPILOT-PRICING-001 | [Microsoft Security Copilot pricing](https://www.microsoft.com/en-us/security/pricing/microsoft-security-copilot/) | official_doc / GC-MS-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SECCOPILOT-PRICING-001.txt` |
| SRC-MS-SRE-001 | [Azure SRE Agent overview](https://learn.microsoft.com/en-us/azure/sre-agent/overview/) | official_doc / GC-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SRE-OVERVIEW-001.txt` |
| SRC-MS-SRE-API-001 | [API reference for Azure SRE Agent](https://learn.microsoft.com/en-us/azure/sre-agent/api-reference) | official_doc / GC-MS-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-MS-SRE-API-001.txt` |
| SRC-MS-SRE-DATA-PRIVACY-001 | [Azure SRE Agent data residency and privacy](https://learn.microsoft.com/en-us/azure/sre-agent/data-privacy/) | official_doc / GC-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SRE-DATA-PRIVACY-001.txt` |
| SRC-MS-SRE-MITIGATIONS-001 | [Azure SRE Agent execute mitigations](https://learn.microsoft.com/en-us/azure/sre-agent/execute-mitigations/) | official_doc / GC-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SRE-MITIGATIONS-001.txt` |
| SRC-MS-SRE-PRICING-001 | [Azure SRE Agent pricing and billing](https://learn.microsoft.com/en-us/azure/sre-agent/pricing-billing/) | official_doc / GC-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SRE-PRICING-001.txt` |
| SRC-MS-SRE-REGIONS-001 | [Azure SRE Agent supported regions](https://learn.microsoft.com/en-us/azure/sre-agent/supported-regions/) | official_doc / GC-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SRE-REGIONS-001.txt` |
| SRC-MS-SRE-SECURITY-001 | [Azure SRE Agent security overview](https://learn.microsoft.com/en-us/azure/sre-agent/security-overview/) | official_doc / GC-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SRE-SECURITY-001.txt` |
| SRC-MS-SRE-SETUP-001 | [Create and Set Up Azure SRE Agent](https://learn.microsoft.com/en-us/azure/sre-agent/create-and-set-up) | official_doc / GC-MS-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-MS-SRE-SETUP-001.txt` |
| SRC-OR-AGENTS-GA-001 | [Enterprise AI Agents are in General Availability in OCI Generative AI](https://docs.oracle.com/iaas/releasenotes/generative-ai/enterprise-ai.htm) | official_release / GC-OR-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-OR-AGENTS-GA-001.txt` |
| SRC-OR-AGENTS-REGIONS-001 | [Generative AI Models and Regions for Enterprise AI Agents](https://docs.oracle.com/en-us/iaas/Content/generative-ai/agentic-regions.htm) | official_doc / GC-OR-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-OR-AGENTS-REGIONS-001.txt` |
| SRC-OR-AGENTS-RETENTION-001 | [Creating a Project in OCI Generative AI](https://docs.oracle.com/en-us/iaas/Content/generative-ai/create-project.htm) | official_doc / GC-OR-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-OR-AGENTS-RETENTION-001.txt` |
| SRC-OR-ENTERPRISE-AGENTS-001 | [Enterprise AI Agents in OCI Generative AI](https://docs.oracle.com/en-us/iaas/Content/generative-ai/agents.htm) | official_doc / GC-OR-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OR-ENTERPRISE-AGENTS-001.txt` |
| SRC-OR-FUSION-AI-001 | [Explore AI Agents for Oracle Fusion Cloud Applications](https://docs.oracle.com/en/cloud/saas/readiness/common/25c/common25c/25C-common-wn-f39182.htm) | official_release / GC-OR-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OR-FUSION-AI-001.txt` |
| SRC-OR-OPSINSIGHTS-001 | [About OCI Operations Insights](https://docs.oracle.com/en-us/iaas/operations-insights/doc/operations-insights.html) | official_doc / GC-OR-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OR-OPSINSIGHTS-001.txt` |
| SRC-SAP-AI-JOULE-001 | [SAP Artificial Intelligence - Joule](https://www.sap.com/products/artificial-intelligence.html) | official_doc / GC-SAP-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SAP-AI-JOULE-001.txt` |
| SRC-SAP-JOULE-AGENTS-001 | [Joule Agents and Joule Assistants](https://www.sap.com/products/artificial-intelligence/ai-agents.html) | official_doc / GC-SAP-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SAP-JOULE-AGENTS-001.txt` |
| SRC-SAP-JOULE-DATACENTER-001 | [SAP S/4HANA Cloud Private Edition - Customer data center option](https://www.sap.com/products/erp/s4hana-private-edition/customer-data-center.html) | official_doc / GC-SAP-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-SAP-JOULE-DATACENTER-001.txt` |
| SRC-SF-AGENTFORCE-001 | [Salesforce Agentforce](https://www.salesforce.com/agentforce/) | official_doc / GC-SF-01 | 2026-11-24 | 待存 / 仅入口 |
| SRC-SN-AGENT-STUDIO-2026-09-001 | [Reimagined AI Agent Studio - September 2026 release](https://www.servicenow.com/community/tkb/articleprintpage/tkb-id/now-assist-articles/article-id/1037) | official_doc / GC-SN-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-SN-AGENT-STUDIO-2026-09-001.txt` |
| SRC-SN-AI-AGENTS-001 | [ServiceNow Otto - AI Agents FAQ and Troubleshooting](https://www.servicenow.com/community/tkb/articleprintpage/tkb-id/now-assist-articles/article-id/218) | official_doc / GC-SN-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-SN-AI-AGENTS-001.txt` |
| SRC-SN-AI-AGENTS-GUIDE-001 | [ServiceNow AI Agents - Build, Operations & Governance Guide (Australia release)](https://www.servicenow.com/community/tkb/articleprintpage/tkb-id/now-assist-articles/article-id/930) | official_doc / GC-SN-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-SN-AI-AGENTS-GUIDE-001.txt` |
| SRC-SN-CONTROLTOWER-001 | [ServiceNow Super Intelligence Control Tower release](https://www.servicenow.com/community/si-control-tower-articles/what-s-new-in-ai-control-tower-for-august-amp-september-2026/ta-p/3597749) | official_doc / GC-SN-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SN-CONTROLTOWER-001.txt` |

### 中国云厂商

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| PUB-BAIDU-INDUSTRY-001 | [百度智能云产业智能体操作系统](https://m.tmtpost.com/nictation/8141994.html) | public_report / CN-BD-01、CN-BD-02、VERT-03 | 2026-11-12 | 待存 / 仅入口 |
| PUB-CHINA-TOP10-001 | [2026 国产运维智能体 TOP10 横评](https://baijiahao.baidu.com/s?id=1877001265169160727) | public_report / CN-DOM-01 | 2026-11-12 | 待存 / 仅入口 |
| PUB-HUAWEI-AEI-001 | [华为智能体@AEI 白皮书报道](https://culture.ifeng.com/c/8wZOlujO5vw) | public_report / CN-HW-02 | 2026-11-12 | 待存 / 仅入口 |
| PUB-HUAWEI-MINDOPS-001 | [华为 Agentic AI 重塑行业运维](https://news.sina.cn/sx/2026-09-22/detail-inissitm5623944.d.html) | public_report / CN-HW-01、VERT-01 | 2026-11-12 | 待存 / 仅入口 |
| PUB-TENCENT-CLOUDQ-001 | [腾讯云 CloudQ 与 AI 可观测](https://www.bjnews.com.cn/detail/1793772689129886.html) | public_report / CN-TX-01、CN-TX-02、CN-TX-03、CN-TX-04、VERT-02 | 2026-11-12 | 待存 / 仅入口 |
| SRC-BD-COMATE-DATA-001 | [文心快码 COMATE 数据安全](https://cloud.baidu.com/doc/COMATE/s/Lm839z700) | official_doc / CN-BD-08 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-COMATE-DATA-001.txt` |
| SRC-BD-COMATE-PRICING-001 | [文心快码 COMATE 产品定价](https://aca.bce.baidu.com/doc/COMATE/s/rlnvnio4a) | official_doc / CN-BD-08 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-COMATE-PRICING-001.txt` |
| SRC-BD-COMATE-PRODUCT-001 | [文心快码 COMATE 产品介绍](https://cloud.baidu.com/doc/COMATE/s/xlnvqe047) | official_doc / CN-BD-08 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-COMATE-PRODUCT-001.txt` |
| SRC-BD-DATABUILDER-001 | [百度胜算·数据智能平台](https://cloud.baidu.com/product/databuilder) | official_doc / CN-BD-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-DATABUILDER-001.txt` |
| SRC-BD-DATABUILDER-VERSIONS-001 | [百度胜算版本购买说明](https://cloud.baidu.com/doc/DataBuilder/s/1mqat32hq) | official_doc / CN-BD-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-DATABUILDER-VERSIONS-001.txt` |
| SRC-BD-DUMATE-001 | [百度搭子开发平台](https://cloud.baidu.com/product-s/dumate_developement_platform.html) | official_doc / CN-BD-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-DUMATE-001.txt` |
| SRC-BD-FAMOU-001 | [百度伐谋](https://cloud.baidu.com/product/famou.html) | official_doc / CN-BD-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-FAMOU-001.txt` |
| SRC-BD-HOGEE-BILLING-001 | [Hogee 计费说明](https://cloud.baidu.com/doc/Hogee/s/bmowpxfa4) | official_doc / CN-BD-07 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-HOGEE-BILLING-001.txt` |
| SRC-BD-HOGEE-PRIVACY-001 | [Hogee 隐私政策](https://cloud.baidu.com/doc/Hogee/s/Jmoy6atzq) | official_doc / CN-BD-07 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-HOGEE-PRIVACY-001.txt` |
| SRC-BD-MIAODA-EXPORT-001 | [秒哒公有云 MIAODA - 源码导出与部署](https://cloud.baidu.com/doc/MIAODA/s/Xmewgmsq7) | official_doc / CN-BD-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-MIAODA-EXPORT-001.txt` |
| SRC-BD-QIANFAN-AGENTINFRA-001 | [文心大模型5.0正式版与百度千帆 Agent Infra](https://home.baidu.com/home/index/news_detail/id/18049) | official_release / CN-BD-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-QIANFAN-AGENTINFRA-001.txt` |
| SRC-BD-YIJING-API-001 | [百度一镜数字人 API](https://cloud.baidu.com/product/huiboxing-api.html) | official_doc / CN-BD-09 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BD-YIJING-API-001.txt` |
| SRC-CLOUDWISE-ITSM-001 | [云智慧智能 IT 服务管理 ITSM 平台](https://www.cloudwise.com/cn/page/jx/dosm.html) | official_doc / CN-DOM-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CLOUDWISE-ITSM-001.txt` |
| SRC-CMCC-OPSAGENT-001 | [智算平台运维智能体](https://ecloud.10086.cn/op-help-center/doc/article/95316) | official_doc / CN-OT-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CMCC-OPSAGENT-001.txt` |
| SRC-EOITEK-AIOPS-001 | [擎创夏洛克 AIOps 一体化数智运维管理平台](https://www.eoitek.com/aiops.html) | official_doc / CN-DOM-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-EOITEK-AIOPS-001.txt` |
| SRC-HW-AEI-2026-001 | [迈向智能世界白皮书2026：智能体@AEI](https://www-file.huawei.com/dam/asset/view/6f374c3a375948ecb039c072063bcbf8.pdf) | official_doc / CN-HW-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-AEI-2026-001.txt` |
| SRC-HW-AGENTARTS-001 | [什么是智果（AgentArts）智能体平台？](https://support.huaweicloud.com/productdesc-agentarts/agentarts_03_0002.html) | official_doc / CN-HW-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-AGENTARTS-001.txt` |
| SRC-HW-CCAE-001 | [华为 CCAE 新型基础设施](https://www.huawei.com/cn/huaweitech/publication/202402/unleashing-intelligence-with-new-infrastructure) | official_doc / CN-HW-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-CCAE-001.txt` |
| SRC-HW-IMASTERCLOUD-001 | [什么是 iMasterCloud](https://support.huaweicloud.com/productdesc-imastercloud/imastercloud_productdesc_0001.html) | official_doc / CN-HW-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-001.txt` |
| SRC-HW-IMASTERCLOUD-ACCOUNT-001 | [iMasterCloud 个人中心设置](https://support.huaweicloud.com/usermanual-imastercloud/imastercloud_usermanual-tenant_100027.html) | official_doc / CN-HW-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-ACCOUNT-001.txt` |
| SRC-HW-IMASTERCLOUD-DATA-001 | [iMasterCloud 产品功能与运维数据](https://support.huaweicloud.com/productdesc-imastercloud/imastercloud_productdesc_0004.html) | official_doc / CN-HW-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-DATA-001.txt` |
| SRC-HW-IMASTERCLOUD-REGIONS-001 | [iMasterCloud 产业区域介绍](https://support.huaweicloud.com/prepare-imastercloud/imastercloud_prepare-account_100029.html) | official_doc / CN-HW-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERCLOUD-REGIONS-001.txt` |
| SRC-HW-IMASTERNCE-001 | [iMaster NCE 网络管控与分析软件](https://e.huawei.com/cn/products/network-management-and-analysis-software/imaster-nce-ip) | official_doc / CN-HW-05、NET-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-IMASTERNCE-001.txt` |
| SRC-HW-MINDOPS-001 | [华为正式发布 MindOps 智算运维解决方案](https://www.huawei.com/cn/news/2026/3/mwc-computing-om-solution) | official_release / CN-HW-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-MINDOPS-001.txt` |
| SRC-HW-SUANXIAOWEI-001 | [第一代集群运维智能体算小维官方视频](https://www.bilibili.com/video/BV1ZBaG62Ek7) | community / CN-HW-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HW-SUANXIAOWEI-001.txt` |
| SRC-INSPUR-INCLOUD-MANAGER-001 | [浪潮云海云数据中心管理平台 InCloud Manager](https://www.inspur.com/lcjtww/2593427/ygpt/2025021409574087926/index.html) | official_doc / CN-OT-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-INSPUR-INCLOUD-MANAGER-001.txt` |
| SRC-JD-AIOPS-001 | [京东云基于自然语言处理的运维日志异常检测 AIOps 实践](https://developer.jdcloud.com/article/2718) | official_doc / CN-OT-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-JD-AIOPS-001.txt` |
| SRC-ME-AIOPS-GUIDE-001 | [ManageEngine 2026 年智能运维 AIOps 软件推荐与选型指南](https://www.manageengine.cn/it-operations-management/articles/aiops-software-guide-2026.html) | official_doc / CN-DOM-06、OBS-15 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ME-AIOPS-GUIDE-001.txt` |
| SRC-TX-ADP-001 | [腾讯智能体开发平台 ADP](https://cloud.tencent.com/product/adp) | official_doc / CN-TX-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-TX-ADP-001.txt` |
| SRC-TX-TCOP-001 | [腾讯云可观测平台 TCOP](https://cloud.tencent.com/product/tcop/) | official_doc / CN-TX-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-TX-TCOP-001.txt` |
| SRC-VOLC-ARK-PRICING-001 | [火山方舟模型服务计费说明](https://docs.volcengine.com/docs/82379/1544681?lang=zh) | official_doc / CN-OT-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-VOLC-ARK-PRICING-001.txt` |
| SRC-VOLC-HIAGENT-001 | [HiAgent 一站式数字员工派遣站](https://www.volcengine.com/product/hiagent) | official_doc / CN-OT-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-VOLC-HIAGENT-001.txt` |
| SRC-VOLC-OPSASSISTANT-001 | [智能运维助手概述](https://docs.volcengine.com/docs/observability/Overview_of_Intelligent_Operations_Assistant) | official_doc / CN-OT-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-VOLC-OPSASSISTANT-001.txt` |
| SRC-XJ-IT-AGENT-001 | [新炬网络 IT 运维 AI 智能体接入数据库云管平台](https://www.shsnc.com/show-10-1370-1.html) | official_doc / CN-DOM-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-XJ-IT-AGENT-001.txt` |
| SRC-YANLONG-SREAGENT-001 | [炎龙智能 SREAgent - Agentic AIOps 智能体 SRE 运维平台](https://www.yanlong-ai.com/) | official_doc / CN-DOM-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-YANLONG-SREAGENT-001.txt` |

### 可观测与 AIOps

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| SRC-BMC-HELIXGPT-AGENTS-001 | [BMC HelixGPT 26.3 Prebuilt agents](https://docs.helixops.ai/bin/Service-Management/Employee-Digital-Workplace/BMC-HelixGPT/helixgpt263/Pre-built-agents/) | official_doc / OBS-14 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BMC-HELIXGPT-AGENTS-001.txt` |
| SRC-BP-L1AGENT-001 | [BigPanda L1 Agent](https://docs.bigpanda.io/docs/l1-agent) | official_doc / OBS-12 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BP-L1AGENT-001.txt` |
| SRC-CANWAY-AGENTICOPS-001 | [嘉为蓝鲸智能体自治运维平台](https://www.canway.net/AgenticOps/2753.html) | official_doc / OBS-22 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CANWAY-AGENTICOPS-001.txt` |
| SRC-CLERIC-AISRE-001 | [Cleric AI SRE](https://www.cleric.ai/) | official_doc / OBS-25 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CLERIC-AISRE-001.txt` |
| SRC-CLERIC-PRICING-001 | [Cleric pricing](https://cleric.ai/pricing.md) | official_doc / OBS-25 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CLERIC-PRICING-001.txt` |
| SRC-CLOUDWISE-CASTREL-001 | [云智慧 Castrel AI SRE](https://www.cloudwise.com/cn/page/jx/castrel.html) | official_doc / OBS-27 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CLOUDWISE-CASTREL-001.txt` |
| SRC-DD-AI-001 | [Datadog Bits AI](https://www.datadoghq.com/product/ai/) | official_doc / OBS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-DD-AI-001.txt` |
| SRC-DD-CLOUDSRE-001 | [Dynatrace Cloud SRE Agents](https://www.dynatrace.com/hub/detail/community-cloudsreagents/) | community / OBS-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-DD-CLOUDSRE-001.txt` |
| SRC-ELASTIC-AI-001 | [Elastic AI Assistant](https://www.elastic.co/docs/explore-analyze/ai-assistant) | official_doc / OBS-08 | 2026-11-24 | 待存 / 仅入口 |
| SRC-EOITEK-DATA-001 | [擎创运维数据中台与大模型能力集成](https://www.eoitek.com/product_page/131.html) | official_doc / OBS-28 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-EOITEK-DATA-001.txt` |
| SRC-GRAFANA-ASSIST-001 | [Grafana Assistant](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/) | official_doc / OBS-07 | 2026-11-24 | 待存 / 仅入口 |
| SRC-HOLMESGPT-001 | [HolmesGPT official repository](https://github.com/HolmesGPT/holmesgpt) | community / OBS-18 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HOLMESGPT-001.txt` |
| SRC-HPE-OPSRAMP-001 | [HPE OpsRamp Software](https://www.hpe.com/us/en/products/software/opsramp-software.html) | official_doc / OBS-13 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HPE-OPSRAMP-001.txt` |
| SRC-INCIDENTIO-AISRE-001 | [incident.io AI SRE](https://incident.io/ai-sre) | official_doc / OBS-20 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-INCIDENTIO-AISRE-001.txt` |
| SRC-K8SGPT-001 | [K8sGPT official repository](https://github.com/k8sgpt-ai/k8sgpt) | community / OBS-19 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-K8SGPT-001.txt` |
| SRC-KOMODOR-KLAUDIA-001 | [Klaudia: Cloud-Native AI SRE](https://help.komodor.com/hc/en-us/articles/22447540595218-Klaudia-Cloud-Native-AI-SRE) | official_doc / OBS-17 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-KOMODOR-KLAUDIA-001.txt` |
| SRC-LM-EDWIN-001 | [LogicMonitor Edwin AI](https://www.logicmonitor.com/edwin-ai) | official_doc / OBS-11 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-LM-EDWIN-001.txt` |
| SRC-METORO-AI-SRE-001 | [Metoro AI SRE Agent](https://metoro.io/ai-sre-agent) | official_doc / OBS-26 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-METORO-AI-SRE-001.txt` |
| SRC-METORO-CLOUD-001 | [Metoro Cloud](https://metoro.io/deployment/metoro-cloud) | official_doc / OBS-26 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-METORO-CLOUD-001.txt` |
| SRC-METORO-PRICING-001 | [Metoro Pricing](https://metoro.io/pricing) | official_doc / OBS-26 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-METORO-PRICING-001.txt` |
| SRC-METORO-TERMS-001 | [Metoro Terms of Service](https://metoro.io/terms-of-service) | official_doc / OBS-26 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-METORO-TERMS-001.txt` |
| SRC-NR-AI-001 | [New Relic AI](https://newrelic.com/platform/new-relic-ai/) | official_doc / OBS-03 | 2026-11-24 | 待存 / 仅入口 |
| SRC-OBSY-AGREEMENT-001 | [观测云 Obsy AI 智能服务使用协议](https://docs.guance.com/agreements/obsy-agent-agreement/) | official_doc / OBS-21 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OBSY-AGREEMENT-001.txt` |
| SRC-OPSRAMP-BYO-LLM-001 | [OpsPilot Bring Your Own LLM/Key](https://docs.opsramp.com/platform-features/feature-guides/copilot/getting-started/bring-your-own-llm/) | official_doc / OBS-13 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OPSRAMP-BYO-LLM-001.txt` |
| SRC-OPSRAMP-OSPILOT-001 | [OpsPilot Capabilities](https://docs.opsramp.com/platform-features/feature-guides/copilot/opspilot/) | official_doc / OBS-13 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OPSRAMP-OSPILOT-001.txt` |
| SRC-OPSRAMP-SECURITY-001 | [OpsRamp Security Reference](https://docs.opsramp.com/platform-features/feature-guides/security-data-management/security/) | official_doc / OBS-13 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OPSRAMP-SECURITY-001.txt` |
| SRC-PD-AIAGENTS-001 | [PagerDuty AI Agents](https://www.pagerduty.com/platform/ai-agents/) | official_doc / OBS-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-PD-AIAGENTS-001.txt` |
| SRC-RESOLVEAI-AISRE-001 | [Resolve.ai AI SRE platform](https://resolve.ai/) | official_doc / OBS-24 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-RESOLVEAI-AISRE-001.txt` |
| SRC-ROOTLY-AISRE-001 | [Rootly AI SRE](https://rootly.com/ai-sre) | official_doc / OBS-23 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ROOTLY-AISRE-001.txt` |
| SRC-SCIENCELOGIC-SKYLAR-001 | [Skylar AI](https://sciencelogic.com/platform/skylar-ai) | official_doc / OBS-09 | 2026-11-24 | 待存 / 仅入口 |
| SRC-SPLUNK-AIASSISTANT-001 | [Splunk AI Assistant](https://www.splunk.com/en_us/products/splunk-ai-assistant.html) | official_doc / OBS-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SPLUNK-AIASSISTANT-001.txt` |
| SRC-SPLUNK-ITSI-001 | [Splunk IT Service Intelligence](https://www.splunk.com/en_us/products/it-service-intelligence.html) | official_doc / OBS-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SPLUNK-ITSI-001.txt` |
| SRC-SUMO-MOBOT-001 | [Sumo Logic Mobot](https://www.sumologic.com/help/docs/search/mobot/) | official_doc / OBS-10 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SUMO-MOBOT-001.txt` |
| SRC-SW-OBS-2026-1-001 | [SolarWinds Observability Self-Hosted 2026.1 release notes](https://documentation.solarwinds.com/en/success_center/orionplatform/content/release_notes/hco_2026-1_release_notes.htm) | official_doc / OBS-16 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SW-OBS-2026-1-001.txt` |
| SRC-YANLONG-PRIVATE-001 | [炎龙智能企业版安全私有部署](https://www.yanlong-ai.com/docs/private-deployment-security.html) | official_doc / OBS-29 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-YANLONG-PRIVATE-001.txt` |

### 安全与 SecOps

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| SRC-CS-CHARLOTTE-001 | [CrowdStrike Charlotte AI](https://www.crowdstrike.com/en-us/platform/charlotte-ai/) | official_doc / SEC-04 | 2026-11-24 | 待存 / 仅入口 |
| SRC-DD-BITS-SECURITY-001 | [Datadog Bits Security Analyst](https://www.datadoghq.com/blog/bits-ai-security-analyst/) | official_release / SEC-09 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-DD-BITS-SECURITY-001.txt` |
| SRC-DROPZONE-AISOC-001 | [Dropzone AI SOC Analyst](https://www.dropzone.ai/ai-soc-analyst) | official_doc / SEC-08 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-DROPZONE-AISOC-001.txt` |
| SRC-DROPZONE-EU-001 | [Dropzone EU Data Residency for AI SOC](https://www.dropzone.ai/eu/ai-soc-data-residency) | official_doc / SEC-08 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-DROPZONE-EU-001.txt` |
| SRC-MS-SECCOPILOT-COMPLIANCE-001 | [Microsoft Security Copilot Data and Compliance FAQ](https://learn.microsoft.com/en-us/copilot/security/faq-data-compliance) | official_doc / SEC-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-SECCOPILOT-COMPLIANCE-001.txt` |
| SRC-PAN-CORTEX-001 | [Palo Alto Networks Cortex](https://www.paloaltonetworks.com/cortex/) | official_doc / SEC-03 | 2026-11-24 | 待存 / 仅入口 |
| SRC-SENTINELONE-PURPLE-AI-001 | [Purple AI: Agentic AI Security Analyst](https://www.sentinelone.com/platform/purple/) | official_doc / SEC-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SENTINELONE-PURPLE-AI-001.txt` |
| SRC-SPLUNK-AI-SECURITY-001 | [Splunk AI in Security](https://www.splunk.com/en_us/products/ai-in-security.html) | official_doc / SEC-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-SPLUNK-AI-SECURITY-001.txt` |

### FinOps

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| SRC-APPTIO-KUBECOST-001 | [IBM Kubecost](https://www.apptio.com/products/kubecost/) | official_doc / FIN-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-APPTIO-KUBECOST-001.txt` |
| SRC-BROADCOM-CLOUDHEALTH-001 | [CloudHealth by Broadcom](https://www.broadcom.com/products/software/finops/cloudhealth) | official_doc / FIN-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BROADCOM-CLOUDHEALTH-001.txt` |
| SRC-BROADCOM-FLEXREPORTS-001 | [CloudHealth FlexReports](https://techdocs.broadcom.com/us/en/ca-enterprise-software/it-operations-management/cloudhealth/saas/index/working-with-reports-and-recommendation-of-tanzu-cloudhealth-working-with-reports-recommendations/working-with-reports-and-recommendation-of-tanzu-cloudhealth-flexreports.html) | official_doc / FIN-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-BROADCOM-FLEXREPORTS-001.txt` |
| SRC-CLOUDZERO-API-001 | [CloudZero billing costs API](https://docs.cloudzero.com/reference/getbillingcosts.md) | official_doc / FIN-07 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CLOUDZERO-API-001.txt` |
| SRC-CLOUDZERO-PRICING-001 | [CloudZero pricing](https://www.cloudzero.com/pricing/) | official_doc / FIN-07 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CLOUDZERO-PRICING-001.txt` |
| SRC-FINOPS-FOUNDATION-001 | [FinOps Foundation - What is FinOps?](https://www.finops.org/introduction/what-is-finops/) | official_doc / FIN-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-FINOPS-FOUNDATION-001.txt` |
| SRC-FINOUT-PRICING-001 | [Finout pricing](https://www.finout.io/pricing) | official_doc / FIN-08 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-FINOUT-PRICING-001.txt` |
| SRC-FLEXERA-CCO-001 | [Flexera Cloud Cost Optimization](https://www.flexera.com/products/flexera-one/cloud-cost-optimization) | official_doc / FIN-09 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-FLEXERA-CCO-001.txt` |
| SRC-HARNESS-CCM-001 | [Harness AI and Cloud Costs](https://www.harness.io/products/cloud-ai-cost-management) | official_doc / FIN-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HARNESS-CCM-001.txt` |
| SRC-IBM-CLOUDABILITY-001 | [IBM Cloudability](https://www.apptio.com/products/cloudability/) | official_doc / FIN-01 | 2026-11-24 | 待存 / 仅入口 |
| SRC-IBM-CLOUDABILITY-2024-001 | [Cloudability - What's new in 2024](https://www.ibm.com/docs/en/cloudability-commercial/cloudability-standard/saas?topic=cloudability-whats-new-in-2024) | official_doc / FIN-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-IBM-CLOUDABILITY-2024-001.txt` |
| SRC-IBM-CLOUDABILITY-2025-001 | [Cloudability - What's new in 2025](https://www.ibm.com/docs/en/cloudability-commercial/cloudability-enterprise/saas?topic=cloudability-whats-new-in-2025) | official_doc / FIN-01 | 2026-11-26 | 已存 `reports/sources/snapshots/SRC-IBM-CLOUDABILITY-2025-001.txt` |
| SRC-VANTAGE-PRICING-001 | [Vantage pricing](https://www.vantage.sh/pricing) | official_doc / FIN-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-VANTAGE-PRICING-001.txt` |

### 网络与云网

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| SRC-ARISTA-CLOUDVISION-001 | [Arista CloudVision](https://www.arista.com/en/products/eos/eos-cloudvision) | official_doc / NET-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ARISTA-CLOUDVISION-001.txt` |
| SRC-ARISTA-EOS-LICENSING-001 | [Arista EOS Licensing](https://www.arista.com/en/support/product-documentation/eos-feature-licensing) | official_doc / NET-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ARISTA-EOS-LICENSING-001.txt` |
| SRC-ARUBA-CENTRAL-001 | [HPE Aruba Central](https://www.hpe.com/us/en/products/networking/aruba-central.html) | official_doc / NET-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ARUBA-CENTRAL-001.txt` |
| SRC-ARUBA-CENTRAL-SUBSCRIPTIONS-001 | [HPE Aruba Networking Central Subscriptions FAQ](https://arubanetworking.hpe.com/techdocs/hpe-central/content/frequently-asked-questions-faq/subscriptions-faq.html) | official_doc / NET-03 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ARUBA-CENTRAL-SUBSCRIPTIONS-001.txt` |
| SRC-CISCO-CLOUDCONTROL-001 | [Cisco Cloud Control - The unified platform for AgenticOps](https://www.cisco.com/site/us/en/solutions/artificial-intelligence/agentic-ops/cisco-cloud-control/index.html) | official_doc / NET-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CISCO-CLOUDCONTROL-001.txt` |
| SRC-CISCO-IQ-FAQ-001 | [FAQ - Cisco IQ Documentation](https://iq.cisco.com/docs/faq.html) | official_doc / NET-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-CISCO-IQ-FAQ-001.txt` |
| SRC-H3C-UCENTER-001 | [H3C U-Center 统一运维平台](https://www.h3c.com/cn/Products_And_Solution/Operation/Service/U_Center_Intelligence/) | official_doc / NET-08 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-H3C-UCENTER-001.txt` |
| SRC-HPE-MIST-REQUIREMENTS-001 | [HPE Mist AI-Native Operations Guide - Requirements](https://networkingdocs.hpe.com/documentation/us/en/software/mist/mist-aiops/topics/concept/aiops-requirements.html) | official_doc / NET-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-HPE-MIST-REQUIREMENTS-001.txt` |
| SRC-NOKIA-ASSURANCE-001 | [Nokia Assurance Center](https://www.nokia.com/autonomous-networks/assurance-center/) | official_doc / NET-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-NOKIA-ASSURANCE-001.txt` |
| SRC-ZTE-UNISEER-001 | [ZTE UniSeer Intelligent Operation and Maintenance](https://www.zte.com.cn/global/solutions_latest/service_and_dgital_patform_01/transworkone02.html) | official_doc / NET-07 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ZTE-UNISEER-001.txt` |

### 内嵌 Agent 助手

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| SRC-ALI-LINGYANG-AGENTONE-001 | [Alibaba Cloud Lingyang AgentOne 发布](https://www.alibabacloud.com/blog/602560) | official_release / EMB-ALI-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-LINGYANG-AGENTONE-001.txt` |
| SRC-ALI-QWENWORK-INTRO-001 | [千问办公简介](https://www.alibabacloud.com/help/zh/qwenwork/qwenwork-intro) | official_doc / EMB-ALI-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ALI-QWENWORK-INTRO-001.txt` |
| SRC-ATLASSIAN-ROVO-001 | [Meet Rovo: AI that knows your business](https://www.atlassian.com/software/artificial-intelligence) | official_doc / EMB-ENT-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ATLASSIAN-ROVO-001.txt` |
| SRC-ATLASSIAN-ROVO-PRIVACY-001 | [Rovo data, privacy, and usage guidelines](https://support.atlassian.com/rovo/docs/rovo-data-privacy-and-usage-guidelines/) | official_doc / EMB-ENT-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-ATLASSIAN-ROVO-PRIVACY-001.txt` |
| SRC-GOOGLE-WORKSPACE-GEMINI-001 | [Google Workspace 為各種企業開創 AI 輔助工作的未來](https://blog.google/intl/zh-tw/products/cloud/google-workspace-enables-future-of-ai-powered-work-for-every-business/) | official_release / EMB-GO-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GOOGLE-WORKSPACE-GEMINI-001.txt` |
| SRC-MS-COPILOT-LICENSING-001 | [License Options for Microsoft Copilot](https://learn.microsoft.com/en-us/copilot/plan/copilot-license-options) | official_doc / EMB-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-COPILOT-LICENSING-001.txt` |
| SRC-MS-COPILOT-REQUIREMENTS-001 | [Microsoft Copilot requirements](https://learn.microsoft.com/en-us/copilot/plan/microsoft-copilot-requirements) | official_doc / EMB-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-COPILOT-REQUIREMENTS-001.txt` |
| SRC-MS-DYNAMICS-REGION-LANGUAGE-001 | [Dynamics 365 Sales 区域以及语言常见问题解答](https://learn.microsoft.com/zh-cn/dynamics365/sales/faq-region-language) | official_doc / EMB-MS-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-DYNAMICS-REGION-LANGUAGE-001.txt` |
| SRC-MS-DYNAMICS-SALES-COPILOT-001 | [Dynamics 365 Sales 中的 Copilot 概述](https://learn.microsoft.com/zh-cn/dynamics365/sales/copilot-overview) | official_doc / EMB-MS-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-DYNAMICS-SALES-COPILOT-001.txt` |
| SRC-MS-M365-COPILOT-001 | [What is Microsoft Copilot?](https://learn.microsoft.com/en-us/copilot/plan/copilot-overview) | official_doc / EMB-MS-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MS-M365-COPILOT-001.txt` |
| SRC-WORKDAY-ILLUMINATE-001 | [Workday Illuminate Expands with New AI Agents](https://newsroom.workday.com/2025-09-16-Workday-Illuminate-TM-Expands-with-New-AI-Agents-for-HR,-Finance,-and-Industry) | official_release / EMB-ENT-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-WORKDAY-ILLUMINATE-001.txt` |

### 垂直行业运维

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| PUB-OPS-WHITEPAPER-001 | [2026 运维智能体定义、架构与落地实践白皮书](https://m.sohu.com/a/1099405014_468661/) | public_report / VERT-04 | 2026-11-12 | 待存 / 仅入口 |

### 方法、标准与协议

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| SRC-EU-AIACT-001 | [EU AI Act regulatory framework](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) | official_doc / METH-04 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-EU-AIACT-001.txt` |
| SRC-GOOGLE-SRE-001 | [Google SRE Workbook](https://sre.google/workbook/table-of-contents/) | official_doc / METH-06 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-GOOGLE-SRE-001.txt` |
| SRC-ISO42001-001 | [ISO/IEC 42001](https://www.iso.org/standard/81230.html) | official_doc / METH-03 | 2026-11-12 | 待存 / 仅入口 |
| SRC-MCP-001 | [Model Context Protocol Specification 2026-07-28](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/main/docs/specification/2026-07-28/index.mdx) | official_doc / PROTO-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-MCP-001.txt` |
| SRC-NIST-AIRMF-001 | [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) | official_doc / METH-02 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-NIST-AIRMF-001.txt` |
| SRC-OTEL-GENAI-001 | [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) | official_doc / METH-05 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OTEL-GENAI-001.txt` |
| SRC-OWASP-GENAI-001 | [OWASP GenAI Security Project](https://genai.owasp.org/) | official_doc / METH-01 | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-OWASP-GENAI-001.txt` |

### 其他公开来源

| source_id | 来源 | 类型 / claim | 访问日 | 快照 |
| --- | --- | --- | --- | --- |
| COM-SERVICENOW-AGENTS-001 | [ServiceNow Now Assist / AI Agents FAQ](https://www.servicenow.com/community/now-assist-articles/ai-agents-faq-and-troubleshooting/tac-p/3207986/highlight/true) | community / 无确定性 claim | 2026-11-12 | 待存 / 仅入口 |
| PUB-AWS-DEVOPS-INFOQ-001 | [AWS DevOps Agent (InfoQ)](https://www.infoq.cn/article/GJED7TYiFFUYb87re523) | public_report / 无确定性 claim | 2026-11-12 | 待存 / 仅入口 |
| PUB-DD-DYNATRACE-COMPARE-001 | [Datadog / Dynatrace AIOps 对比](https://bbs.huaweicloud.com/blogs/489129) | public_report / 无确定性 claim | 2026-11-12 | 待存 / 仅入口 |
| SRC-A2A-001 | [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/) | official_doc / 无确定性 claim | 2026-11-25 | 已存 `reports/sources/snapshots/SRC-A2A-001.txt` |

<!-- END GENERATED REFERENCES -->

## 延伸阅读：AgentOps 与评测

- [阿里云 AgentLoop：OpenTelemetry GenAI 链路埋点](https://help.aliyun.com/en/agentloop/add-a-custom-tracking-point-to-the-call-chain-by-loongsuite-otel-util-genai-and-opentelemetry-sdk) — 延伸阅读，不承载 AgentLoop 产品能力 claim。
- [AWS：运营 Agentic AI 的生命周期管理](https://docs.aws.amazon.com/zh_cn/prescriptive-guidance/latest/strategy-operationalizing-agentic-ai/focus-areas-lifecycle.html) — 延伸阅读。
- [Google SRE Workbook](https://sre.google/workbook/table-of-contents/) — SRE 实践延伸阅读，不是产品能力证据。

## 延伸阅读：安全、风险与监管

- [OWASP Top 10 for Agentic Applications (2026)](https://docs.modulos.ai/frameworks/owasp-top-10-agentic) — 延伸阅读；引用时须核对版本。
- [2026–2027 Agentic AI 行业趋势综述（Gartner 数据引用）](https://www.huxiu.com/article/4898504.html) — 延伸阅读，引用原始数据前须复核。
- [AICon 北京 2026 议题](https://m.toutiao.com/article/7694552134070567487/) — 延伸阅读。

## K8s 与云原生

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Kubernetes PodDisruptionBudget](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
- [Kubernetes Events](https://kubernetes.io/docs/reference/kubernetes-api/cluster-resources/event-v1/)
- [Argo CD](https://argo-cd.readthedocs.io/)
- [Flux](https://fluxcd.io/)

## RDMA / 高性能网络

- [NVIDIA Networking Documentation](https://docs.nvidia.com/networking/)
- [NCCL Documentation](https://docs.nvidia.com/deeplearning/nccl/)
- [perftest](https://github.com/linux-rdma/perftest)
- [NVIDIA GPUDirect](https://docs.nvidia.com/cuda/gpudirect-rdma/)

## GPU 推理

- [NVIDIA DCGM](https://docs.nvidia.com/datacenter/dcgm/latest/)
- [NVIDIA XID Errors](https://docs.nvidia.com/datacenter/dcgm/latest/)
- [vLLM Documentation](https://docs.vllm.ai/)
- [SGLang Documentation](https://docs.sglang.ai/)
- [TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/)
- [Triton Inference Server](https://github.com/triton-inference-server/server)

## Agent 工程与协议

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/)

## 本书案例

- [端到端案例：K8s 节点 NotReady](./case-notready) — 合成/脱敏案例，用于演示证据包、审批、执行与复盘。
- [失败复盘：一个没有上线的 Agent](./case-failed-agent) — 合成复盘，由多个真实项目中反复出现的失败模式组合而成。

两个案例均不包含真实客户数据；如与你的环境相似，请替换为自有证据与流程后再使用。

## 本仓库相关

- [The Ops Agent Book](https://github.com/ai-guru-global/the-ops-agent-book)
- [agent-landing](https://github.com/ai-guru-global/agent-landing) — 官方 Agent 服务目录的检索与选型工具。
