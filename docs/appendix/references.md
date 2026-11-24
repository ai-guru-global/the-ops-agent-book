---
title: 参考资料
description: 阿里 Agent 产品、厂商地图、K8s、RDMA、GPU 推理与 Agent 工程的参考来源。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 附录：参考资料

> 本页最后核实：**2026-11-24**；复核截止：**2027-02-22**。产品能力、计费与文档会变化，使用前请以官方最新页面为准。

## 来源 ID 与 claim 回指

厂商页和阿里附录中的可核验能力使用稳定 `claim_id → source_id`。例如 `GC-AWS-01 → SRC-AWS-DEVOPS-001`、`ALI-02 → SRC-ALI-AGENTRUN-001`、`OBS-08 → SRC-ELASTIC-AI-001`。机器可读字段（类型、访问日、`review_by`、快照、适用 claim）见仓库 `sources/registry.yaml`；阅读版见[来源注册表](./source-registry)。

- `official_doc`：官方文档或官方产品页；营销页只证明“厂商如此宣称”，不等于生产能力、SLA、客户规模、区域或商业条款证明。
- `official_release`：可定位的官方发布；本任务核心 claim 未依赖单独发布条目。
- `public_report`：公开报道/转载；必须与官方事实分开，不能自动升级。
- `community`：项目仓库、项目文档或社区材料；“production-ready”等自述不是独立生产验证。
- “未核实”表示本轮没有足够证据，**不等于否定**；不得猜测 GA/预览、区域、价格、驻留或退出条款。
- 动态目录数量只在明确快照日使用。本轮删除“36 Agent / 328 Skills”的当前事实表述，且未重新计数。

## 阿里 Agent 产品与生态

| source_id | 来源 | 类型 / 适用 claim |
| --- | --- | --- |
| SRC-ALI-CATALOG-001 | [阿里云 Agent 服务目录](https://agentcatalog.aliyun.com/) | official_doc / ALI-01；目录入口，未重计数 |
| SRC-ALI-AGENTRUN-001 | [AgentRun 是什么](https://help.aliyun.com/zh/agentrun/what-is-agentrun) | official_doc / ALI-02、ALI-04 |
| SRC-ALI-SANDBOX-001 | [智能体沙箱 Agent Sandbox](https://help.aliyun.com/zh/agent-sandbox/) | official_doc / ALI-03 |
| SRC-ALI-AGENTBAY-001 | [无影 AgentBay](https://www.alibabacloud.com/en/product/agentbay) | official_doc / ALI-05 |
| COM-AGENTSCOPE-001 | [AgentScope GitHub](https://github.com/agentscope-ai/agentscope) | community / ALI-06 |
| COM-QWEN-AGENT-001 | [Qwen-Agent GitHub](https://github.com/QwenLM/Qwen-Agent) | community / ALI-07；本地 Python executor 未沙箱化，仅限本地测试 |
| COM-SPRING-AI-ALIBABA-001 | [Spring AI Alibaba](https://spring-ai-alibaba.github.io) | community / ALI-08 |
| PUB-ALI-SUMMIT-001 | [2026 阿里云峰会 Agent Native 产品报道](https://culture.ifeng.com/c/8tPjCX8bdEh) | public_report / ALI-09–11、ALI-16；仅报道口径 |

延伸阅读（不承载本任务 material claim）：[云 Skills 门户](https://help.aliyun.com/zh/skillsportal)、[AgentRun API：AgentRuntime](https://help.aliyun.com/zh/agentrun/api-agentrun-2025-09-10-struct-agentruntime)、[Alibaba Cloud Linux 4 Agentic Edition](https://help.aliyun.com/en/alinux/agentic-os)、[Qoder CN 家族](https://developer.aliyun.com/article/1770127)、[百炼 Model Studio](https://help.aliyun.com/zh/model-studio/)。

## 全球云厂商

| source_id | 来源 | 适用 claim |
| --- | --- | --- |
| SRC-AWS-DEVOPS-001 | [AWS DevOps Agent](https://aws.amazon.com/devops-agent/) | GC-AWS-01；Release Management 明示 Preview |
| SRC-AWS-QDEV-001 | [Amazon Q Developer](https://aws.amazon.com/q/developer/) | GC-AWS-02；IDE 插件 2027-04-30 停止支持 |
| SRC-AWS-AGENTCORE-001 | [What is Amazon Bedrock AgentCore?](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html) | GC-AWS-04 |
| SRC-AWS-QUICK-001 | [AWS Quick](https://aws.amazon.com/quick/) | GC-AWS-05；当前官方名称 |
| SRC-MS-SRE-001 | [Azure SRE Agent](https://azure.microsoft.com/en-us/products/sre-agent) | GC-MS-01 |
| SRC-MS-COPILOT-001 | [Azure Copilot](https://azure.microsoft.com/en-us/products/copilot) | GC-MS-02 |
| SRC-MS-COPILOT-DOC-001 | [Azure Copilot overview](https://learn.microsoft.com/en-us/azure/copilot/overview) | GC-MS-02；费用、用户确认与 national clouds 边界 |
| SRC-MS-FOUNDRY-001 | [Microsoft Foundry](https://azure.microsoft.com/en-us/products/ai-foundry) | GC-MS-04 |
| SRC-GH-COPILOT-001 | [GitHub Copilot](https://github.com/features/copilot) | GC-MS-05 |
| SRC-IBM-CONCERT-001 | [IBM Concert](https://www.ibm.com/products/concert) | GC-IBM-01 |
| SRC-IBM-INSTANA-001 | [IBM Instana](https://www.ibm.com/products/instana) | GC-IBM-02 |
| SRC-IBM-ORCH-001 | [IBM watsonx Orchestrate](https://www.ibm.com/products/watsonx-orchestrate) | GC-IBM-03 |
| SRC-IBM-TURBO-001 | [IBM Turbonomic](https://www.ibm.com/products/turbonomic) | GC-IBM-04 |
| SRC-IBM-QRADAR-001 | [IBM QRadar](https://www.ibm.com/products/qradar) | GC-IBM-05、SEC-07 |
| SRC-SF-AGENTFORCE-001 | [Salesforce Agentforce](https://www.salesforce.com/agentforce/) | GC-SF-01 |

Google Cloud、Oracle、SAP、ServiceNow 产品正文及 Microsoft Security Copilot 本轮未取得足够证据，相关能力与商业字段均为“未核实”。公开报道 [AWS DevOps Agent (InfoQ)](https://www.infoq.cn/article/GJED7TYiFFUYb87re523)（PUB-AWS-DEVOPS-INFOQ-001）与官方社区入口 [ServiceNow Now Assist / AI Agents FAQ](https://www.servicenow.com/community/now-assist-articles/ai-agents-faq-and-troubleshooting/tac-p/3207986/highlight/true)（COM-SERVICENOW-AGENTS-001）仅保留导航，不承载确定性 claim。

## 中国云厂商公开报道线索

| source_id | 来源 | 类型 / 适用 claim |
| --- | --- | --- |
| PUB-HUAWEI-MINDOPS-001 | [华为 Agentic AI 重塑行业运维](https://news.sina.cn/sx/2026-09-22/detail-inissitm5623944.d.html) | public_report / CN-HW-01、VERT-01 |
| PUB-HUAWEI-AEI-001 | [华为智能体@AEI 白皮书报道](https://culture.ifeng.com/c/8wZOlujO5vw) | public_report / CN-HW-02 |
| PUB-TENCENT-CLOUDQ-001 | [腾讯云 CloudQ 与 AI 可观测](https://www.bjnews.com.cn/detail/1793772689129886.html) | public_report / CN-TX-01–04、VERT-02 |
| PUB-BAIDU-INDUSTRY-001 | [百度智能云产业智能体操作系统](https://m.tmtpost.com/nictation/8141994.html) | public_report / CN-BD-01–02、VERT-03 |
| PUB-CHINA-TOP10-001 | [2026 国产运维智能体 TOP10 横评](https://baijiahao.baidu.com/s?id=1877001265169160727) | public_report / CN-DOM-01；仅导航 |
| PUB-OPS-WHITEPAPER-001 | [2026 运维智能体定义、架构与落地实践白皮书](https://m.sohu.com/a/1099405014_468661/) | public_report / VERT-04；行业路径线索 |

## 可观测、安全与 FinOps

| source_id | 来源 | 适用 claim |
| --- | --- | --- |
| SRC-DD-AI-001 | [Datadog Bits AI](https://www.datadoghq.com/product/ai/) | OBS-01 |
| SRC-NR-AI-001 | [New Relic AI](https://newrelic.com/platform/new-relic-ai/) | OBS-03 |
| SRC-GRAFANA-ASSIST-001 | [Grafana Assistant](https://grafana.com/docs/grafana-cloud/machine-learning/assistant/) | OBS-07 |
| SRC-ELASTIC-AI-001 | [Elastic AI Assistant](https://www.elastic.co/docs/explore-analyze/ai-assistant) | OBS-08 |
| SRC-SCIENCELOGIC-SKYLAR-001 | [Skylar AI](https://sciencelogic.com/platform/skylar-ai) | OBS-09 |
| SRC-CS-CHARLOTTE-001 | [CrowdStrike Charlotte AI](https://www.crowdstrike.com/en-us/platform/charlotte-ai/) | SEC-04 |
| SRC-PAN-CORTEX-001 | [Palo Alto Networks Cortex](https://www.paloaltonetworks.com/cortex/) | SEC-03；仅平台入口，Prisma AIRS 3.0 未核实 |
| SRC-IBM-CLOUDABILITY-001 | [IBM Cloudability](https://www.apptio.com/products/cloudability/) | FIN-01 |

第三方比较文章 [Datadog / Dynatrace AIOps 对比](https://bbs.huaweicloud.com/blogs/489129)（PUB-DD-DYNATRACE-COMPARE-001）只作线索，不用于证明能力或计费。

## AgentOps、可观测与评测

- SRC-OTEL-GENAI-001：[OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — GenAI 语义约定（METH-05）。
- [阿里云 AgentLoop：OpenTelemetry GenAI 链路埋点](https://help.aliyun.com/en/agentloop/add-a-custom-tracking-point-to-the-call-chain-by-loongsuite-otel-util-genai-and-opentelemetry-sdk) — 延伸阅读，不承载 AgentLoop 产品能力 claim。
- [AWS：运营 Agentic AI 的生命周期管理](https://docs.aws.amazon.com/zh_cn/prescriptive-guidance/latest/strategy-operationalizing-agentic-ai/focus-areas-lifecycle.html) — 延伸阅读。
- SRC-GOOGLE-SRE-001：[Google SRE Book](https://sre.google/sre-book/table-of-contents/) 与 [Workbook](https://sre.google/workbook/table-of-contents/) — SRE 实践（METH-06），不是产品能力证据。

## 安全、风险与监管

- SRC-OWASP-GENAI-001：[OWASP GenAI Security Project](https://genai.owasp.org/) — METH-01。
- [OWASP Top 10 for Agentic Applications (2026)](https://docs.modulos.ai/frameworks/owasp-top-10-agentic) — 延伸阅读；引用时须核对版本。
- SRC-NIST-AIRMF-001：[NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) — METH-02。
- SRC-ISO42001-001：[ISO/IEC 42001](https://www.iso.org/standard/81230.html) — METH-03；不据此宣称产品已认证。
- SRC-EU-AIACT-001：[EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — METH-04；具体适用范围需法律复核。

## 行业趋势与市场

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

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)

## 本书案例

- [端到端案例：K8s 节点 NotReady](./case-notready) — 合成/脱敏案例，用于演示证据包、审批、执行与复盘。
- [失败复盘：一个没有上线的 Agent](./case-failed-agent) — 合成复盘，由多个真实项目中反复出现的失败模式组合而成。

两个案例均不包含真实客户数据；如与你的环境相似，请替换为自有证据与流程后再使用。

## 本仓库相关

- [The Ops Agent Book](https://github.com/ai-guru-global/the-ops-agent-book)
- [agent-landing](https://github.com/ai-guru-global/agent-landing) — 官方 Agent 服务目录的检索与选型工具。
