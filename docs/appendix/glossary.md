---
title: 术语表
description: 运维 Agent、K8s、RDMA、GPU 推理与 Agent 工程常用术语。
---

# 附录：术语表

## Agent 工程

| 术语 | 英文 | 含义 |
| --- | --- | --- |
| 智能体 | Agent | 能感知环境、做决策、调用工具并执行任务的系统 |
| 副驾驶 | Copilot | 只读、给建议，不直接改变系统 |
| 操作员 | Operator | 在审批/策略下执行变更 |
| 人类在环 | HITL (Human-in-the-loop) | 关键动作由人确认 |
| 证据包 | Evidence Bundle | 查询、来源、时间、结果、置信度的结构化集合 |
| 工具契约 | Tool Contract | 工具的输入/输出、副作用、权限、回滚、审计约定 |
| Runbook 2.0 | — | 可执行、可验证、可回滚、可升级的 Runbook |
| 爆炸半径 | Blast Radius | 一次动作最多影响的范围 |
| 预演 | Dry-run | 不产生真实副作用的执行演练 |
| 影子模式 | Shadow Mode | Agent 在真实流量下给建议但不执行 |
| 灰度 | Canary | 小范围真实执行，观察后扩大 |
| 只读降级 | Read-only Degradation | 关闭写能力，保留查询与建议 |
| 熔断 | Circuit Breaker | 异常时停止调用，防止扩散 |
| 评测集 | Eval Set | 覆盖正常、边界、对抗、安全、未知的案例集 |
| 黄金集 | Golden Set | 人工标注、用于校准评测的基准集 |

## 协议与平台

| 术语 | 含义 |
| --- | --- |
| MCP | Model Context Protocol，模型与工具/上下文连接协议 |
| A2A | Agent-to-Agent，智能体互操作协议 |
| OpenAPI | 云服务/工具的 HTTP API 描述规范 |
| Agent Runtime | Agent 运行时，负责执行、会话、状态、弹性与隔离 |
| Sandbox | 隔离执行环境，用于代码/工具/浏览器操作 |
| Agentic OS | 面向 Agent 的操作系统/发行版 |
| AgentRun | 阿里云的一站式 Agentic AI 基础设施产品 |
| AgentScope | 阿里通义实验室开源的多智能体开发框架 |
| AgentBay | 无影 Agent 开发套件/云端 GUI 沙箱 |

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
