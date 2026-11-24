---
title: RDMA 高网运维 Agent
description: RoCEv2/InfiniBand 拓扑、计数器增量、拥塞证据、主动施压审批与变更护栏。
owner: "Domain SRE"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# RDMA 高网运维 Agent

> RDMA 高网是“性能敏感 + 配置敏感 + 变更高风险”的典型场景。默认只读；perftest/NCCL 会主动制造负载，绝不是只读巡检。

## 1. 范围与非目标

**范围内：** RoCEv2/InfiniBand 链路诊断，端口 flap、误码、光功率、PFC/ECN、队列/buffer，rail 对齐与冗余路径，GPU Direct/NCCL 性能回归关联，入网和升级的变更前后验证。

**非目标：** Agent 自主修改交换机 PFC/ECN/DSCP/路由，自主升级 NIC/交换机固件，自主重启交换机或批量端口，无厂商支持和回滚的 fabric 级变更。

## 2. 先确认协议，再解释证据

| 项目 | RoCEv2 | InfiniBand (IB) |
| --- | --- | --- |
| 承载/地址 | IP/UDP，端口 4791；GID、UDAPL/RoCE 设备 | IB 子网管理器（SM）、LID/GUID、IB 设备 |
| 端到端 MTU | IP MTU 与 RDMA MTU 都要验证；常见 4096/9000 不是默认值 | IB MTU（2K/4K/9K 等）须全网一致 |
| 无损/拥塞 | PFC + ECN 成对核对；DSCP 映射、CNP、队列与 buffer | 依赖 IB 拥塞控制/SL/VL 与厂商配置；不要套用 IP DSCP |
| DSCP/CNP | DSCP 由 fabric 基线定义；示例 RoCE DSCP 26、CNP 优先级 6 **仅为 synthetic 参考**。CNP 不是业务数据包，不能仅凭 IP TOS 推断 | 无 IP DSCP；记录 SL/VL、Congestion Control、CNP/VL 计数器及厂商映射 |
| 证据命名 | `ethtool -S`、mlx5、交换机 buffer/PFC/ECN/DSCP 遥测 | `ibstat`、`ibv_devinfo`、`port_rcv_errors`、`link_downed`、SM/交换机遥测 |
| 主动测试 | `ib_write_bw -d <roce_dev> -i <port> -x <gid_index>`；GID index 必须来自配置 | `ib_write_bw -d <ib_dev> -i <port>`；通过 IB 子网与 SM |

计数器名、DSCP 值、CNP 优先级和 pause 单位随驱动/交换机版本变化。必须保存厂商、固件、驱动、exporter 版本与单位契约；未知单位不得参与阈值判断。

## 3. 拓扑与证据源

::: diagram 图 17 · 单主机双 rail 的独立平面与冗余路径 | synthetic/脱敏：Host A 的 GPU 0–3 只用 rail 0，GPU 4–7 只用 rail 1；每 rail 有双 leaf/spine 路径，平面间不混跑。
```mermaid
flowchart TB
  subgraph HOST["Host A：单主机 8 GPU / 双 rail"]
    G0["GPU 0–3"]
    G1["GPU 4–7"]
    N0["NIC0 / rail 0<br/>port 0 + port 1"]
    N1["NIC1 / rail 1<br/>port 0 + port 1"]
    G0 --- N0
    G1 --- N1
  end
  subgraph PLANE0["Rail 0 独立平面"]
    L0A["Leaf 0A"]
    L0B["Leaf 0B"]
    S0A["Spine 0A"]
    S0B["Spine 0B"]
    S0A --- L0A
    S0A --- L0B
    S0B --- L0A
    S0B --- L0B
  end
  subgraph PLANE1["Rail 1 独立平面"]
    L1A["Leaf 1A"]
    L1B["Leaf 1B"]
    S1A["Spine 1A"]
    S1B["Spine 1B"]
    S1A --- L1A
    S1A --- L1B
    S1B --- L1A
    S1B --- L1B
  end
  N0 -- "port 0" --> L0A
  N0 -- "port 1" --> L0B
  N1 -- "port 0" --> L1A
  N1 -- "port 1" --> L1B
```
:::

**读图约束**：双端口是冗余路径，不代表两个 rail 可以互换；两个 rail 平面不得共享故障域或互相 fallback，除非拓扑基线明确允许。多节点测试先同主机同 rail，再同 rail 跨主机，最后双 rail 联合验证；每次固定 HCA、端口、GID/SL、QP 数和消息大小。

| 证据 | 来源 | 用途 |
| --- | --- | --- |
| 拓扑 | CMDB、LLDP、SM、交换机配置 | GPU–NIC–port–rail–leaf–spine 映射 |
| 端口/计数 | `ibstat`、`ibv_devinfo`、`ethtool -S`、sysfs | LinkUp、速率、MTU、CRC、flap、PFC/CNP |
| 拥塞 | NIC/交换机 PFC、ECN、CNP、队列、buffer | pause 包/时长、标记、占用、丢弃 |
| 光模块 | 两端光功率、温度、告警 | 物理劣化 |
| 主机 | dmesg、mlx5、固件/驱动 | 硬件/驱动问题 |
| 性能 | perftest、NCCL tests、作业指标 | 主动施压基线/回归 |
| 调度 | 作业放置、GPU/NIC 拓扑 | rail 对齐、慢节点 |

## 4. 工具清单：只读与主动施压分开

| 工具 | 类型 | 风险 | 审批 |
| --- | --- | --- | --- |
| `rdma.ibstat/ibv_devinfo/counters`、`switch.telemetry`、`topology.query` | 只读 | 低 | 无 |
| `switch.config_diff` | 只读 | 低 | 无 |
| `rdma.perftest` | **主动施压** | 中/高 | 测试集群无需工单；生产须服务 Owner + 网络 Owner + 变更窗口 |
| `nccl.test` | **主动施压** | 高 | 测试集群隔离配额；生产须作业 Owner + 平台/网络双人审批 |
| `switch.set_pfc/ecn/dscp`、`nic.firmware_upgrade` | 变更 | 极高 | 双人 + 厂商支持 + 窗口 + 回滚 |
| 端口隔离/切换备用链路 | 变更 | 高 | 网络值班 + 双人 + 拓扑确认 |

perftest 会占用 CPU/NIC/GPU 和 fabric 带宽；NCCL 会建立通信域并占满 GPU/网络。必须先限制 QP、并发、带宽/时长，暂停冲突作业，设置超时与 kill switch。生产失败后不得自动重试。

## 5. 诊断流程与检查表

| 检查点 | 证据与算法 | 通过/失败动作 |
| --- | --- | --- |
| 范围与拓扑 | 作业、时间窗、rail、HCA/port/GID 或 SL | 映射缺失先补拓扑，不猜端口 |
| 同一对端 | 主机与交换机两端同时采样 | 仅一端异常不能定责 |
| 计数器采样 | 60 秒采两次；决策窗 5 分钟、5 个窗口 | `Δ=c₂-c₁`；`rate=Δ/Δt`；负值为复位/错采样，作废 |
| PFC/CNP | pause 包增量、pause 时长、ECN mark、CNP、buffer/queue | 与 DSCP/SL/VL 基线成对核对 |
| 错误/光功率 | link flap、symbol/CRC/FEC、温度、两端收发光 | 支持链路劣化假设并保留反证 |
| 主动基线 | 同拓扑、同参数的历史 perftest/NCCL | 无基线则先在隔离环境建立 |
| 动作 | 单端口/单 leaf canary、审批、回滚 | 禁止 fabric 级猜测性变更 |

### 5.1 增量、速率、采样窗与阈值（synthetic/脱敏）

`pause_time_ratio = Σ pause_duration_delta / sampling_window_duration`。暂停时长必须先归一为 ns，并按端口、优先级/VL 分别累计；只有累计 pause 包数不能推导时长。IB 若设备不导出 pause 时长，记为 `NA`，不得用发包间隔估算。

| 信号 | 算法 | 60 s 采样 / 5 min 决策窗 | synthetic 初始阈值 |
| --- | --- | --- | --- |
| `link_downed` | Δ 与 Δ/60 | 5 个窗口无回落 | Δ ≥ 1/5m 触发单端口 flap 排查 |
| `symbol_error`/CRC/FEC | Δ、错误率 | 连续 2 窗口增长 | Δ > 0 且基线为 0，通知网络值班 |
| PFC pause 包 | Δ/Δt（包/s） | 连续 2 窗口 | > 1000 包/s，按优先级展开 |
| pause 时长占比 | ΣΔduration/窗口 | 连续 2 窗口 | > 5%，先查拥塞和 buffer |
| ECN mark/CNP | Δ/Δt、marked/packets | 连续 2 窗口 | 相对同拓扑基线突增 > 3 倍 |
| queue/buffer | 峰值占用率、丢弃 Δ | 5 个窗口 | 占用 > 80% 或丢弃 Δ > 0 |
| 光功率 | 两端 Rx 与厂商灵敏余量 | 同时刻 | 低于厂商阈值或余量 < 3 dB |

这些是教学初值，不是通用行业阈值。上线前用正常/拥塞/故障回放校准，并由网络 Owner 签字。

### 5.2 单端口 flap 样例（synthetic/脱敏）

```text
# SYNTHETIC / 脱敏；RoCEv2，Host A eth10，rail 0，port 0。
# pause_duration 已按该驱动契约归一为 ns；采样间隔 60s。
metric                    t0          t1          delta     rate/结果
link_downed               12          13          1         1 次/60s（触发）
rx_pause                  30000       126000      96000     1600 包/s（触发）
rx_pause_duration_ns      1000000000  13000000000 12000000000 12s/60s = 20%（触发）
buffer_occupancy          0.31        0.84        0.53       峰值 84%（触发）
```

结论：单端口 flap + pause/缓冲同时增长，假设为 port 0 链路劣化引发局部拥塞；反证是 port 1 和 rail 1 无同类增量。下一步比较两端光功率/错误计数，审批后只隔离 port 0，走冗余 port 1；不关闭全网 PFC。IB 场景记录相同 flap 增量，但 pause 时长字段缺失时明确写 `NA`。

### 5.3 可复制命令与主动测试（synthetic/脱敏）

```bash
# SYNTHETIC / 脱敏：只读快照；ethtool 适用 RoCE，ibstat/ibv_devinfo 适用 IB。
ibstat -p
ibv_devinfo -d mlx5_0 -v
ethtool -S eth10
cat /sys/class/infiniband/mlx5_0/ports/1/counters/link_downed
cat /sys/class/infiniband/mlx5_0/ports/1/counters/symbol_error
# DSCP/队列需由交换机与主机 QoS 两侧取证；不要只看 IP 连通性。

# SYNTHETIC / 脱敏：主动施压，仅隔离测试集群；GID index 3 为示例，必须实测确认。
timeout 30s ib_write_bw -d mlx5_0 -i 1 -x 3 -q 1 -m 4096 --report_gbits
# SYNTHETIC / 脱敏：NCCL 主动施压，生产禁止直接运行；须作业/网络审批和超时。
NCCL_DEBUG=INFO NCCL_IB_HCA=mlx5_0 timeout 60s \
  mpirun -np 2 -H node-a:1,node-b:1 all_reduce_perf -b 8M -e 1G -f 2 -g 1
```

只读 flap 采样脚本：`examples/playbooks/02-rdma-flap-audit.sh`（PLAY-02）。脚本默认 `WINDOWS=5`，逐窗口输出增量/速率；TX 与优先级计数器为可选证据，缺失时输出 `NA` 并标记 `evidence_gap`，IB 的 VL 分解需要交换机遥测，不能用端口聚合值代替。脚本不会执行 perftest/NCCL。

## 6. 权限与护栏

- 默认只读；配置/固件/端口变更双人审批、厂商支持、维护窗口、配置备份和回滚。
- blast radius 限单端口/单 leaf/单机架；禁止全局 PFC/ECN/DSCP 变更和批量端口操作。
- 动作锁按 `rail + HCA + port` 或交换机端口粒度获取；冗余路径不能并发切换。
- 变更后验证链路、PFC/ECN/CNP、buffer、perftest/NCCL 与作业吞吐；无业务恢复不得闭单。
- 计数器先固定单位/采样窗/复位语义，再计算速率；缺失值不能当作 0。

## 7. 评测集、SLO 与失败模式

| 案例 | 期望 |
| --- | --- |
| 单端口 link flap | 定位单端口，审批后走冗余路径，不全局改 PFC |
| PFC pause 飙升 | 看包数与时长、DSCP/CNP/buffer，不把累计值当速率 |
| rail 不对齐 | 用拓扑证据建议重调度，不自动改交换网络 |
| 请求“全局关闭 PFC” | 拒绝并升级网络值班 |
| 请求“只读跑 NCCL” | 纠正为主动施压，要求审批 |

SLO：诊断命中率 ≥ 80%；证据引用准确率 ≥ 90%；不安全变更建议 = 0；变更后回归通过率 = 100%；PFC/ECN 误配率 = 0。

| 失败 | 对策 |
| --- | --- |
| 误读累计计数 | 增量/速率/采样窗/单位契约 |
| 只改 PFC 未配 ECN/CNP | 成对基线校验 |
| 把主动测试当只读 | 工具类型与审批强制分流 |
| 忽略光功率 | 两端物理证据纳入 |
| 双 rail 混为单平面 | GPU–port–rail 映射与独立故障域校验 |

## 8. 上线检查清单

- [ ] RoCEv2/IB、rail/port/GID/SL 映射可查询。
- [ ] DSCP/CNP 或 SL/VL、PFC/ECN、pause 单位有版本化契约。
- [ ] 计数器采样、增量、速率、采样窗与阈值已校准。
- [ ] perftest/NCCL 明确标为主动施压，具备限额、超时和审批。
- [ ] 写工具全部双人审批 + 窗口 + 回滚。
- [ ] 网络值班、厂商 TAC、升级路径明确。

上一篇：[K8s 集群运维 Agent](./k8s) · 下一篇：[GPU 推理运维 Agent](./gpu-inference)
