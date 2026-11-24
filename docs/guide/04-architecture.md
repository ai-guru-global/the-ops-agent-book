---
title: 架构与运行模式
description: 运维 Agent 的参考架构、五种运行模式、工具分层、状态机与多 Agent 边界。
owner: "Content Lead + Domain Reviewer"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 04 架构与运行模式

> 架构的目标不是“看起来像智能体”，而是让每一次观察、决策、行动和验证都可解释、可控制、可回放。

## 参考架构

::: diagram 图 04 · 运维 Agent 参考架构 | 分层数据面承载观察、规划与执行；策略、可观测和审计作为横切控制面作用于每一次工具调用。
```mermaid
flowchart TB
  subgraph CP["横切控制面 · 贯穿工具调用与状态迁移"]
    direction LR
    POL["策略控制面<br/>RBAC/ABAC · 窗口 · blast radius<br/>dry-run · 审批绑定 · 撤销"]
    OBS["可观测控制面<br/>Trace · 指标 · 成本 · 评测"]
    AUD["审计控制面<br/>append-only 证据 · 决策 · 结果"]
  end
  subgraph DP["分层数据面 · 不把上下文当作串行处理阶段"]
    direction TB
    U["入口层<br/>Chat / IM / 工单 / CLI / API / 告警"]
    O["编排与推理层<br/>工作流 / 模型 · 状态机 · 共享证据"]
    C["上下文与知识层<br/>服务目录 / 拓扑 / 指标 / 日志 / Runbook<br/>按任务检索，而非一次性灌入"]
    T["工具与凭证层<br/>只读查询 / 分析 / 变更 / 验证<br/>结构化契约 · 短时凭证 · 幂等"]
    S["被管系统层<br/>集群 / 云 / 网络 / 应用 / 数据"]
    U --> O
    O <--> C
    O --> T
    T --> S
    S -. 新证据 .-> C
  end
  POL -. 调用前授权与审批 .-> O
  POL -. 调用前策略 / 调用后验证 .-> T
  OBS -. 状态迁移与结果 .-> O
  OBS -. 延迟 / 错误 / 业务指标 .-> T
  AUD -. 不可抵赖事件 .-> O
  AUD -. 调用与结果哈希 .-> T

  classDef diagram fill:#f4f4f4,stroke:#0f62fe,stroke-width:1.5px,color:#161616;
  class U,O,C,T,S,POL,OBS,AUD diagram;
```
:::

数据面分层不等于串行流水线：上下文按任务反复检索，规划与验证可穿插，工具执行前必须经过策略控制面。策略、可观测和审计贯穿所有状态与调用，而不是等工具执行后才补检查。

每一层都要能独立替换：模型可以换、工具可以换、运行时可以换，但**证据格式、工具契约、权限模型和 Trace 数据模型**应保持稳定。

## 五种运行模式

| 模式 | 适合 | 不适合 | 关键设计 |
| --- | --- | --- | --- |
| **Copilot** | 告警解释、诊断建议、Runbook 导航 | 需要变更 | 只读工具、证据引用、明确“不知道” |
| **Workflow** | 步骤明确的 SOP、巡检、预检 | 高度不确定的故障 | 确定性步骤 + LLM 处理分支与文本 |
| **Supervisor** | 多领域诊断（K8s + 网络 + 存储） | 简单单步任务 | 明确分工、共享证据、汇总与冲突处理 |
| **Multi-Agent** | 事故指挥、跨团队协作 | 可用单 Agent 解决的场景 | 角色、通信协议、共享状态、终止条件 |
| **Event-driven** | 自动巡检、告警触发、定时任务 | 需要复杂判断的高风险变更 | 事件去重、幂等、速率限制、熔断 |

::: warning 多 Agent 不是默认答案
多 Agent 会增加协调成本、状态不一致和不可观测性。能用一个 Agent + 工具编排解决的，不要拆成多个 Agent。
:::

## 一次运行的 State Machine

::: diagram 图 05 · 一次运行的 State Machine | 只读诊断走无审批快路径；写操作必须经 AWAIT_APPROVAL 才能 EXECUTE，拒绝、失败、重规划与安全恢复均有显式出口。
```mermaid
stateDiagram-v2
  [*] --> INTAKE
  INTAKE --> OBSERVE
  OBSERVE --> HYPOTHESIZE
  HYPOTHESIZE --> READ_ONLY_GATE
  READ_ONLY_GATE --> VERIFY: 仅只读诊断 / 无需审批
  VERIFY --> REPORT: 证据与结论完整
  REPORT --> CLOSED
  HYPOTHESIZE --> PLAN: 需要变更
  PLAN --> AWAIT_APPROVAL: 冻结计划并绑定审批
  AWAIT_APPROVAL --> REJECTED: deny / 撤销 / 过期
  REJECTED --> CLOSED
  AWAIT_APPROVAL --> REPLAN: 计划或目标版本变化
  REPLAN --> PLAN: 生成新计划与新审批包
  AWAIT_APPROVAL --> REVALIDATE: approved
  REVALIDATE --> EXECUTE: 范围 / 版本 / 窗口 / 凭证仍有效
  REVALIDATE --> REPLAN: 重新校验失败
  EXECUTE --> VERIFY: 全部成功
  EXECUTE --> TOOL_FAILED: 工具失败 / 结果未知
  EXECUTE --> VERIFY: 部分成功 / 停止后续步骤
  VERIFY --> OBSERVE: 只读证据不足
  VERIFY --> ESCALATE: 不确定 / 停止条件
  TOOL_FAILED --> REPLAN: 可安全重新规划
  TOOL_FAILED --> ROLLBACK: 可逆且已授权
  TOOL_FAILED --> ESCALATE: 不可逆 / 结果未知
  VERIFY --> ROLLBACK: 未通过且满足回滚条件
  VERIFY --> RECOVERY: 不可逆 / 部分成功 / 回滚不安全
  VERIFY --> REPORT: 通过
  VERIFY --> REPLAN: 需要调整方案
  ROLLBACK --> VERIFY: 回滚后验证
  ROLLBACK --> ESCALATE: 回滚失败
  RECOVERY --> VERIFY: 补偿或安全恢复后验证
  RECOVERY --> ESCALATE: 停止条件触发 / 恢复失败
  ESCALATE --> REPORT
  CLOSED --> [*]

  classDef diagram fill:#f4f4f4,stroke:#0f62fe,stroke-width:1.5px,color:#161616;
  class INTAKE,OBSERVE,HYPOTHESIZE,READ_ONLY_GATE,PLAN,AWAIT_APPROVAL,REVALIDATE,EXECUTE,VERIFY,REPORT,CLOSED,REJECTED,REPLAN,TOOL_FAILED,ROLLBACK,RECOVERY,ESCALATE diagram;
```
:::

状态机按**动作权限**分流，而不是按是否叫“诊断”分流：纯只读查询可以从 `OBSERVE` 到 `VERIFY`，不进入审批等待；任何写工具（包括 cordon、drain、清理日志、复位、uncordon）都必须先进入 `AWAIT_APPROVAL`。策略自动放行只是审批的一种方式，也必须生成可审计的审批记录。等待批准后不能直接执行，必须重新校验计划、目标资源版本、窗口和凭证。

| 状态 | 系统要做什么 | 必须留下什么 |
| --- | --- | --- |
| INTAKE | 识别意图、范围、环境、风险 | 原始请求、会话 ID、操作者 |
| OBSERVE / HYPOTHESIZE | 收集证据并形成候选根因 | 证据包、假设及支持/反证 |
| READ_ONLY_GATE | 验证整条路径无写副作用；有写即转 PLAN | 只读判定、工具契约版本 |
| PLAN / REPLAN | 生成动作、diff、影响面、停止条件与补偿；变化即升计划版本 | 计划版本、计划摘要、目标资源版本 |
| AWAIT_APPROVAL | 等待绑定该计划版本的人或策略审批 | 审批人、时间、有效期、计划哈希 |
| REJECTED | 拒绝、撤销或审批过期后禁止执行 | 拒绝原因、撤销传播时间 |
| REVALIDATE | 重查 scope、PDB、资源版本、窗口、依赖和凭证 | 重新校验结果与新证据 |
| EXECUTE | 按批准步骤幂等执行；部分成功即停 | 工具 Trace、幂等键、逐步结果 |
| TOOL_FAILED | 区分确定性失败与结果未知；未知结果不得盲目重试 | 错误分类、尝试次数、对账结果 |
| VERIFY | 验证节点、工作负载、PDB、SLO 与用户路径 | 验证结果和证据 |
| ROLLBACK | 仅在可逆、已授权且回滚条件满足时执行 | 回滚计划、凭证、结果 |
| RECOVERY | 对不可逆或部分成功执行补偿/安全恢复 | 补偿记录、恢复条件和人工接管 |
| ESCALATE / REPORT / CLOSED | 超时、高风险或停止条件触发时交给人并闭环 | 升级原因、接收人、最终报告 |

## 工具分层

| 层 | 作用 | 示例 | 默认权限 |
| --- | --- | --- | --- |
| **只读查询** | 获取事实 | 查 Pod、查指标、查日志、查拓扑 | 只读 |
| **分析** | 把事实变成判断 | 依赖图、基线对比、异常检测、容量模型 | 只读 |
| **变更** | 改变系统 | 重启、扩容、回滚、切换、改配置 | 受控写 |
| **验证** | 证明变更有效 | 健康检查、SLO、日志、用户路径 | 只读 |
| **治理** | 控制变更 | 审批、凭证、策略、审计 | 平台 |

每个工具都应该有契约：输入、输出、副作用、幂等性、dry-run、超时、错误分类、审计字段、回滚方式。模板见[工具契约](../templates/tool-contract)。

## 上下文构建

上下文不是“把日志都塞进去”，而是按任务检索最小充分证据：

1. **身份与范围**：环境、集群、服务、实例、时间窗口。
2. **状态**：指标、日志、链路、事件、配置、变更历史。
3. **结构**：拓扑、依赖、服务目录、负责人。
4. **知识**：Runbook、事故库、策略、厂商文档。
5. **约束**：变更窗口、维护模式、合规要求、blast radius。

每条证据都要带 `source`、`timestamp`、`query`、`environment` 和 `confidence`。没有来源的上下文，不应该进入结论。

## 策略层

策略层决定“能不能做”，而不是“模型想不想做”：

- **RBAC/ABAC**：谁能用哪个工具、对哪些资源。
- **变更窗口**：什么时间允许变更。
- **Blast radius**：一次动作最多影响多少实例/租户。
- **Dry-run**：是否必须先预演。
- **审批**：哪些动作必须人工批准，谁有权批准。
- **速率/并发**：防止 Agent 循环调用或批量误操作。
- **熔断/终止**：异常时立即停止。

策略应该是独立于 Prompt 的代码/配置，可审计、可测试、可回滚。

## 记忆设计

| 记忆类型 | 内容 | 生命周期 |
| --- | --- | --- |
| 会话记忆 | 当前事故的对话、证据、动作 | 小时级 |
| 事故记忆 | 时间线、根因、修复、复盘 | 月/年级 |
| 拓扑记忆 | 服务、主机、网络、GPU 关系 | 天级，需刷新 |
| Runbook 记忆 | 可执行 SOP 与版本 | 版本化 |
| 反馈记忆 | 人工纠正、评价、失败案例 | 持续积累 |

记忆最大的风险是“过期”。每条记忆都要有 TTL、来源和版本；过期拓扑比没有拓扑更危险。

## 可观测性

一个 Agent 的运行记录至少包含：

- 输入：请求、操作者、环境、范围。
- 证据：查询、来源、时间、结果摘要。
- 决策：候选假设、选择理由、置信度。
- 动作：工具、参数、审批、执行结果。
- 验证：指标、日志、SLO、结论。
- 成本：Token、工具调用、耗时。
- 结果：成功/失败/升级/回滚。

没有这些，事故复盘只能靠猜。

## 多 Agent 的边界

多 Agent 适合“角色分工明确、证据可共享、终止条件清晰”的场景，例如事故指挥：Commander、Diagnostician、SRE、Communicator。

失败模式包括：

- 多个 Agent 同时执行冲突动作。
- 共享状态不一致，重复诊断。
- 责任不清，没人对最终动作负责。
- 通信成本高于收益。
- 观测链断裂，无法还原决策。

设计多 Agent 时，先定义**共享证据板、动作仲裁者和终止条件**，再定义角色。

## 平台选择

运行时与框架只是架构的一层。选型时优先看：

- 是否支持长任务、会话恢复、沙箱、工具治理、Trace、评测。
- 是否兼容开放协议（MCP、OpenAPI、A2A）与现有系统。
- 是否能导出数据，避免锁定。
- 是否有你需要的合规与数据驻留能力。

阿里生态的 AgentRun、AgentScope、Agent Sandbox/AgentBay、Qoder Cloud Agents、百炼、AgentLoop 等如何映射到这些层，见[附录：阿里 Agent 产品全景](../appendix/alibaba-agent-landscape)。

## 本章检查清单

- [ ] 运行模式是否与场景复杂度匹配？是否过度使用多 Agent？
- [ ] 是否有完整的状态机、终止条件、升级与安全恢复路径？
- [ ] 策略、可观测和审计是否作为横切控制面作用于每次调用？
- [ ] 工具是否按只读/分析/变更/验证/治理分层？
- [ ] 上下文是否带来源、时间、环境与置信度？
- [ ] 策略是否独立于 Prompt，可审计、可测试？
- [ ] 是否有完整的运行 Trace 与成本记录？

下一章：[工具、权限与安全护栏](./05-tools-permissions)
