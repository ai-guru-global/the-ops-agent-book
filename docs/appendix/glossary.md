---
title: 术语表
description: 运维 Agent、K8s、RDMA、GPU 推理与 Agent 工程常用术语。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 附录：术语表

> 本表是全书术语的阅读视图。工程术语以首次定义章节为准；产品名称是时点事实，能力与状态必须回指[来源注册表](./source-registry)，不能把产品名当作通用架构层。

## Agent 工程

| 术语 | 英文 | 含义 | 首次定义 / 主要使用 |
| --- | --- | --- | --- |
| 智能体 | Agent | 能感知环境、做决策、调用工具并执行任务的系统 | [01 为什么需要运维 Agent](../guide/01-why-ops-agents) |
| 副驾驶 | Copilot | 只读、给建议，不直接改变系统 | [04 架构](../guide/04-architecture) |
| 操作员 | Operator | 在审批/策略下执行变更的身份或角色；不承担最终决策责任 | [04 架构](../guide/04-architecture)、[05 工具与权限](../guide/05-tools-permissions) |
| 人类在环 | HITL (Human-in-the-loop) | 关键动作由具备授权的人类确认 | [05 工具与权限](../guide/05-tools-permissions) |
| 证据包 | Evidence Bundle | 查询、来源、时间、结果、置信度的结构化集合 | [06 上下文与知识](../guide/06-context-knowledge) |
| 工具契约 | Tool Contract | 工具的输入/输出、副作用、权限、回滚、审计约定 | [05 工具与权限](../guide/05-tools-permissions) |
| Runbook 2.0 | — | 可执行、可验证、可回滚、可升级的 Runbook | [Runbook → Tool 映射](../templates/runbook-tool-map) |
| 爆炸半径 | Blast Radius | 一次动作最多影响的范围 | [05 工具与权限](../guide/05-tools-permissions) |
| 预演 | Dry-run | 不产生真实副作用的执行演练 | [05 工具与权限](../guide/05-tools-permissions) |
| 影子模式 | Shadow Mode | 在真实流量或快照上独立给出建议，不产生真实写入 | [07 评测与发布](../guide/07-evaluation-release) |
| 灰度 | Canary | 通过评测与发布门禁后，在限定租户、集群、场景和流量内产生真实副作用，观察达标才扩量；不等同于 Shadow | [07 评测与发布](../guide/07-evaluation-release) |
| 只读降级 | Read-only Degradation | 关闭写能力，保留查询与建议 | [05 工具与权限](../guide/05-tools-permissions) |
| 熔断 | Circuit Breaker | 异常时停止调用，防止扩散 | [08 运营与改进](../guide/08-operate-improve) |
| 评测集 | Eval Set | 覆盖正常、边界、对抗、安全、未知的案例集 | [07 评测与发布](../guide/07-evaluation-release) |
| 黄金集 | Golden Set | 人工标注并冻结、用于核心回归与 Judge 验收的基准集 | [评测集模板](../templates/eval-set) |

## 身份、治理与可观测性

| 术语 | 英文 | 含义 | 首次定义 / 主要使用 |
| --- | --- | --- | --- |
| 非人身份 | NHI (Non-Human Identity) | Agent 或工作负载使用独立、可归因、受限且短时凭证的身份；不得共用人类账号 | [12 身份与安全](../guide/12-identity-security) |
| 策略执行点 | PEP (Policy Enforcement Point) | 在工具/API 网关强制执行 allow/deny 的控制点；只读调用也不能绕过 | [12 身份与安全](../guide/12-identity-security) |
| 计划哈希 | plan_hash | 对不可变计划规范化后计算的 SHA-256；覆盖工具、参数、目标、顺序、影响面、停止条件、恢复与有效期 | [05 工具与权限](../guide/05-tools-permissions) |
| 审批绑定 | approval_binding | 把审批决定绑定到 `plan_version`、`plan_hash`、目标资源版本、审批人、级别与 `expires_at` 的契约；任一关键字段变化即失效 | [05 工具与权限](../guide/05-tools-permissions) |
| 会话 | Session | 一段连续的用户/Agent 交互与上下文边界，可包含多个任务 Run | [11 AgentOps 与可观测性](../guide/11-agentops-observability) |
| 运行 | Run | 一次有边界、有 `run_id`、有状态机且以明确终态结束的任务执行 | [11 AgentOps 与可观测性](../guide/11-agentops-observability) |
| 追踪链 | Trace | 描述 Run 的证据、模型、工具、审批、验证与结果之间因果关系的版本化事件图；跨 Run 转交保留来源标识 | [11 AgentOps 与可观测性](../guide/11-agentops-observability) |
| Agent 运维 | AgentOps | 用统一事件账本、Trace、评测、成本与治理闭环持续证明 Agent 正确、安全、可停止和可回滚的工程实践 | [11 AgentOps 与可观测性](../guide/11-agentops-observability) |
| 急停开关 | kill switch | 位于 Agent 之外的独立控制，停止新动作并关闭工具网关写入口；同时处理排队与在途写，不只是杀进程 | [08 运营与改进](../guide/08-operate-improve) |
| 最后已知良好版本 | LKG (Last Known Good) | 最近通过门禁且经独立验证健康的不可变版本 bundle；回滚目标包含模型、Prompt、工具、知识、策略与评测 | [08 运营与改进](../guide/08-operate-improve) |
| 复核截止 | review_by | 事实、来源或资产下一次必须复核的日期；到期不等于事实必然错误，但不能继续作为未复核的发布依据 | [来源注册表](./source-registry)、[GOVERNANCE.md](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md) |

## 协议与平台

| 术语 | 英文 | 含义 | 首次定义 / 主要使用 |
| --- | --- | --- | --- |
| MCP | Model Context Protocol | 模型/应用连接工具与上下文资源的开放协议；不替代身份、授权与审计 | [04 架构](../guide/04-architecture)、[12 身份与安全](../guide/12-identity-security) |
| A2A | Agent-to-Agent | Agent 任务互操作协议；不自动授予跨域权限，也不替代治理 | [14 自进化与 A2A](../guide/14-future-roadmap) |
| OpenAPI | — | 云服务/工具的 HTTP API 描述规范 | [04 架构](../guide/04-architecture) |
| Agent Runtime | — | 通用 Agent 运行时，负责执行、会话、状态、弹性与隔离；不是某个产品名 | [04 架构](../guide/04-architecture) |
| Sandbox | — | 隔离执行环境，用于代码、工具或浏览器操作 | [04 架构](../guide/04-architecture) |
| Agentic OS | — | 面向 Agent 的操作系统/发行版；具体产品能力须逐项核验 | [04 架构](../guide/04-architecture) |
| AgentRun | — | 阿里云 Agent 运行时/基础设施产品；官方文档描述 Serverless Runtime、沙箱、工具、凭证与观测，不把它与通用 Runtime 或 Agent 产品混为一层 | [04 架构](../guide/04-architecture)、[阿里 Agent 产品全景](./alibaba-agent-landscape) |
| AgentScope | — | 阿里通义实验室开源的多智能体开发框架；不是可即用的运维 Agent 产品 | [阿里 Agent 产品全景](./alibaba-agent-landscape) |
| AgentBay | — | 阿里云无影 AgentBay，面向 Browser、Computer、Code、Mobile 的云端执行隔离产品/套件；不等同于 AgentRun 或通用 Agent 编排框架 | [04 架构](../guide/04-architecture)、[阿里 Agent 产品全景](./alibaba-agent-landscape) |

## 章节反向索引

| 章节 | 使用本章术语时优先回读 |
| --- | --- |
| [04 架构](../guide/04-architecture) | Agent Runtime、Sandbox、MCP、AgentRun、AgentBay |
| [05 工具与权限](../guide/05-tools-permissions) | Tool Contract、Dry-run、PEP、plan_hash、approval_binding、kill switch |
| [07 评测与发布](../guide/07-evaluation-release) | Eval Set、Golden Set、Shadow Mode、Canary、LKG |
| [08 运营与改进](../guide/08-operate-improve) | AgentOps、Trace、Session、Run、kill switch、LKG |
| [09 组织治理](../guide/09-organization-governance) | NHI、approval_binding、review_by、证据与门禁 |
| [11 AgentOps](../guide/11-agentops-observability) | Trace、Session、Run、AgentOps、approval_binding |
| [12 身份与安全](../guide/12-identity-security) | NHI、PEP、MCP、kill switch |
| [14 自进化与 A2A](../guide/14-future-roadmap) | A2A、Canary、AgentOps |

## K8s

| 术语 | 含义 |
| --- | --- |
| Pod | K8s 最小调度单元 |
| Deployment | 无状态工作负载与滚动发布 |
| StatefulSet | 有状态工作负载 |
| Node | 集群节点 |
| PDB | PodDisruptionBudget，保障自愿中断时的可用性 |
| HPA | Horizontal Pod Autoscaler |
| CNI | 容器网络接口 |
| CSI | 容器存储接口 |
| GitOps | 以 Git 为期望状态源的部署方式（Argo/Flux） |
| Cordon / Drain | 标记节点不可调度 / 驱逐节点上的 Pod |
| Rollout Undo | 回滚到上一版本 |

## RDMA / 高网

| 术语 | 含义 |
| --- | --- |
| RDMA | Remote Direct Memory Access，远程直接内存访问 |
| RoCE / RoCEv2 | 基于以太网的 RDMA |
| IB | InfiniBand |
| PFC | Priority Flow Control，基于优先级的流控 |
| ECN | Explicit Congestion Notification，显式拥塞通知 |
| Rail | 智算网络中按 GPU/网卡划分的并行网络平面 |
| Leaf / Spine | 数据中心网络的两级交换架构 |
| NCCL | NVIDIA 集合通信库 |
| perftest | RDMA 带宽/延迟测试工具集 |
| link_downed | 链路 down 次数 |
| symbol errors | 物理层符号错误 |

## GPU 推理

| 术语 | 含义 |
| --- | --- |
| GPU | 图形处理器，此处指 AI 加速卡 |
| DCGM | NVIDIA Data Center GPU Manager |
| XID | NVIDIA GPU 错误码 |
| ECC | 纠错码，GPU 显存错误检测/纠正 |
| MIG | Multi-Instance GPU，GPU 切分 |
| NVLink / NVSwitch | GPU 间高带宽互联 |
| TTFT | Time To First Token，首 Token 延迟 |
| TPOT / ITL | Time Per Output Token / Inter-Token Latency |
| KV Cache | 推理时缓存 Key/Value，占显存 |
| Prefill / Decode | 推理的预填充/解码阶段 |
| Quantization | 量化，降低显存与算力开销 |
| vLLM / SGLang / TensorRT-LLM / Triton | 常见推理框架/服务 |

## 运营

| 术语 | 含义 |
| --- | --- |
| SLO / SLI | 服务目标 / 指标 |
| MTTR | 平均恢复时间 |
| RTO / RPO | 恢复时间目标 / 恢复点目标 |
| CMDB | 配置管理数据库 |
| ITSM | IT 服务管理 |
| CAB | 变更咨询委员会 |
| Blameless | 不追责个人的复盘文化 |
