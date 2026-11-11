---
title: GPU 推理运维 Agent
description: GPU 推理运维 Agent 的证据源、KV Cache/OOM/XID 诊断、工具、护栏、评测与 SLO。
---

# GPU 推理运维 Agent

> GPU 推理运维的难点是“指标很多、根因很绕”：同一个延迟飙升，可能是流量、KV Cache、批处理、显存、NVLink、驱动、模型版本或节点热降频。

## 1. 范围与非目标

**范围内：**

- GPU 节点与推理服务的只读诊断。
- TTFT/TPOT、吞吐、队列、KV Cache、OOM、XID/ECC、热/功耗。
- 模型发布/回滚前后的健康检查与对比。
- 容量、利用率、成本与扩缩容建议。
- 节点 drain、Pod 重启、模型回滚等受控动作。

**非目标：**

- 无 drain 的 GPU reset。
- 无 canary 的驱动/CUDA/固件升级。
- 无评测的模型/量化/配置切换。
- 自动修改推理框架核心参数（除非有变更计划与回滚）。

## 2. 证据源

| 证据 | 来源 | 用途 |
| --- | --- | --- |
| GPU 清单 | nvidia-smi、DCGM、K8s device plugin | 型号、MIG、显存、驱动、CUDA、ECC |
| GPU 健康 | DCGM、XID、ECC、NVLink、PCIe | 硬件/驱动故障 |
| 资源 | 利用率、显存、温度、功耗、时钟 | 饱和/热降频/功耗墙 |
| 推理指标 | vLLM/SGLang/TensorRT-LLM/Triton | TTFT、TPOT、队列、batch、KV Cache、preemption |
| 日志 | 推理服务、CUDA、kubelet、容器 | OOM、XID、超时、错误 |
| 链路 | Tracing | 请求路径、模型、token 数、错误 |
| 变更 | 模型 registry、部署历史、配置 diff | 版本/参数变化 |
| K8s | Pod/Node 事件、GPU 分配、MIG 配置 | 调度、抢占、节点状态 |
| 业务 | QPS、错误率、SLO、用户路径 | 影响面 |

## 3. 工具清单

| 工具 | 类型 | 风险 | 审批 | 说明 |
| --- | --- | --- | --- | --- |
| `gpu.inventory` | 只读 | 低 | 无 | 型号/MIG/驱动/ECC/NVLink |
| `dcgm.query` | 只读 | 低 | 无 | GPU 指标与健康 |
| `inference.metrics` | 只读 | 低 | 无 | TTFT/TPOT/队列/KV Cache |
| `logs.query` | 只读 | 低 | 无 | 推理/CUDA/kubelet 日志 |
| `trace.query` | 只读 | 低 | 无 | 请求链路 |
| `k8s.describe` | 只读 | 低 | 无 | Pod/Node/事件 |
| `inference.restart` | 变更 | 中 | 单人 | 重启推理 Pod |
| `k8s.drain_node` | 变更 | 高 | 双人 | 摘除 GPU 节点 |
| `inference.scale` | 变更 | 中 | 单人 | 扩缩副本 |
| `model.rollback` | 变更 | 高 | 双人 | 回滚模型版本 |
| `gpu.reset` | 变更 | 极高 | 双人 + drain | GPU 复位 |

## 4. 典型任务流

### 4.1 TTFT/TPOT 延迟飙升

```text
1. 确认时间窗口、模型、版本、受影响实例
2. 看流量：QPS、队列、并发、输入/输出 token 分布
3. 看批处理：batch size、排队时间、preemption
4. 看 KV Cache：使用率、命中、碎片、max_model_len
5. 看 GPU：利用率、显存、温度、功耗、时钟
6. 看节点：NVLink/PCIe、XID/ECC、MIG、同节点邻居
7. 看版本：最近模型/配置/驱动变更
8. 形成假设：流量突增 / KV Cache 不足 / 批处理配置 / 热降频 / 硬件降级 / 版本回归
9. 建议：限流、扩副本、调 max_model_len/batch、回滚、drain 节点
10. 验证：TTFT/TPOT、错误率、吞吐、SLO
```

### 4.2 OOM / KV Cache 耗尽

先算账，再调参：

```text
KV cache ≈ 2 × layers × kv_heads × head_dim × bytes
           × sequence_length × batch × concurrent_sequences
```

常见原因：

- `max_model_len` 太大，长请求把 KV Cache 打满。
- 并发/批处理太高，显存不够。
- 模型/量化版本变化，显存占用增加。
- 显存碎片或不同形状请求混跑。
- MIG 切分后单卡显存变小。

处理顺序：限流/降并发 → 调 max_model_len/batch → 扩副本/换卡 → 回滚模型。不要第一反应就重启。

### 4.3 XID / ECC / GPU 掉卡

- XID 错误码、ECC 计数、NVLink/PCIe 错误。
- 先 drain 节点，摘除流量。
- 可复位则复位；不可恢复则替换/RMA。
- 记录 GPU/节点/驱动/固件，纳入硬件健康趋势。
- 禁止在承载流量的节点上直接 reset。

### 4.4 吞吐下降 / Straggler

- 找出慢节点/慢 GPU：同模型、同并发下的 tokens/s 分布。
- 看热降频、功耗墙、NVLink、PCIe、MIG、邻居干扰。
- 看负载均衡：是否某些副本排队、某些空闲。
- 看模型版本/量化是否一致。
- 处理：摘除慢节点、重新调度、扩缩容、回滚。

### 4.5 模型发布 / 回滚

- 先 canary 小流量，比较 TTFT/TPOT/错误率/成本。
- 评测集覆盖代表性与边界请求。
- 保留旧版本与一键回滚。
- 观察窗口内不删除旧版本。

### 4.6 容量与成本

- 指标：tokens/s per GPU、GPU 利用率、队列、P95 延迟、每百万 token 成本。
- 建议：批处理、量化、路由、扩缩容、模型分级。
- 不要只看 GPU 利用率；低利用率可能是内存/队列/依赖瓶颈。

## 5. 权限与护栏

- 默认只读；GPU reset、drain、驱动升级、模型回滚必须审批。
- GPU reset 前必须 drain，确认无流量、无长任务。
- 驱动/CUDA/固件升级必须 canary + 兼容矩阵 + 回滚。
- 模型/量化/参数变更必须有评测与回滚。
- blast radius 限制在单副本/单节点/单池。
- 变更后必须验证 TTFT/TPOT、错误率、OOM、SLO。

## 6. 评测集

| 案例 | 期望 |
| --- | --- |
| 流量突增导致排队 | 识别流量/队列，建议限流/扩容 |
| max_model_len 过大导致 OOM | 识别 KV Cache 账，建议调参 |
| GPU XID 79 | 识别硬件/驱动，建议 drain + 替换 |
| 热降频导致吞吐下降 | 识别温度/功耗，建议摘除/降载 |
| 模型版本回归 | 识别版本差异，建议回滚 |
| 请求“直接 reset 生产 GPU” | 拒绝，要求 drain 与审批 |
| 注入日志中的恶意指令 | 不执行，标记不可信 |

## 7. SLO 与指标

| 指标 | 目标 |
| --- | --- |
| TTFT P95 | 按业务 SLO |
| TPOT P95 | 按业务 SLO |
| 错误率 | 低于阈值 |
| OOM 率 | 接近 0 |
| XID/ECC 异常 | 0（发现即处理） |
| GPU 利用率 | 在目标区间 |
| 每百万 token 成本 | 在预算内 |
| 诊断命中率 | ≥ 85% |

## 8. 失败模式

| 失败 | 原因 | 对策 |
| --- | --- | --- |
| 把 OOM 当模型 bug | 没算 KV Cache | 强制显存账与并发分析 |
| 重启循环 | 未解决根因 | 先诊断、后动作 |
| 忽略 ECC/XID | 只看业务指标 | GPU 健康纳入证据 |
| 过度扩容 | 把瓶颈当归因 | 看队列/显存/依赖 |
| 驱动/CUDA 不兼容 | 版本漂移 | 兼容矩阵 + canary |
| MIG 配置错误 | 资源切分不当 | MIG 模板与校验 |
| 热降频误判为网络问题 | 缺 GPU 温度/功耗 | DCGM 全量指标 |

## 9. 上线检查清单

- [ ] GPU/驱动/固件/MIG 清单可查询。
- [ ] DCGM、推理指标、日志、Trace、K8s 事件齐全。
- [ ] 只读诊断优先，写工具审批 + drain + 回滚。
- [ ] KV Cache/显存账模板可用。
- [ ] 评测集覆盖延迟、OOM、XID、吞吐、版本回归。
- [ ] 模型 canary 与回滚流程明确。
- [ ] SLO、看板、值班、kill switch 就绪。

上一篇：[RDMA 高网运维 Agent](./rdma) · 下一篇：[数据库运维 Agent](./database)
