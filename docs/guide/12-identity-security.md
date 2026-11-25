---
title: 身份、权限与安全
description: Agent 身份/NHI、委托、最小权限、MCP 信任、OWASP Agentic Top 10 与供应链安全。
owner: "Content Lead + Domain Reviewer"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 12 身份、权限与安全

> 运维 Agent 的安全，不是“加一个内容审核”。它要回答：Agent 是谁、代表谁、能做什么、做完谁负责。

## Agent 身份（NHI）

Agent 是一个非人类身份（Non-Human Identity, NHI），必须有：

- **唯一身份**：不是共用人的账号，不是共享 API Key。
- **归属**：属于哪个团队/场景/Owner。
- **委托关系**：代表谁、在什么条件下、多长时间。
- **最小权限**：按工具、资源、环境、时间、blast radius。
- **短时凭证**：按任务签发，任务结束即失效。
- **可审计**：每次调用记录身份、委托、审批、动作。

::: diagram 图 14 · 身份、委托与审计链 | 不可传递委托签发短时 Claims；策略执行先于工具调用，写操作还必须审批，拒绝与撤销均有显式路径。
```mermaid
flowchart LR
  H["人类 / 系统委托者<br/>明确 scope 与期限"] --> D{"身份与委托有效?<br/>Claims / 撤销列表"}
  D -- 否 --> X["拒绝<br/>不调用工具"]
  D -- 是 --> A["Agent NHI<br/>短时 / 受限 / 不可传递"]
  A --> P["策略执行点 PEP<br/>RBAC/ABAC · 资源版本 · 窗口"]
  P -- deny --> X
  P -- allow --> R{"需要写操作?"}
  R -- 否：只读 --> T["工具调用<br/>绑定身份与短时凭证"]
  R -- 是 --> AP["审批 PEP<br/>绑定计划哈希 / 版本 / 有效期"]
  AP -- deny / expired --> X
  AP -- allow --> V{"调用前重新校验"}
  V -- 失败 --> X
  V -- 通过 --> T
  T --> O["记录结果 / 部分成功 / 错误"]
  O --> U["审计<br/>who / on_behalf_of / what / why / outcome"]
  RV["撤销事件<br/>委托 / 角色 / 凭证 / 审批"] -. 同步传播 .-> D
  RV -. 阻断待执行与后续调用 .-> V

  classDef diagram fill:#f4f4f4,stroke:#0f62fe,stroke-width:1.5px,color:#161616;
  class H,D,A,P,R,AP,V,T,O,U,X,RV diagram;
```
:::

策略执行与审批都是**工具调用前的强制控制点**，不能画成工具调用之后补记。只读调用可跳过人工审批，但不能跳过 PEP；所有写调用必须先审批再重新校验。委托链不可传递：Agent 不得把权限再授予子 Agent、外部 Skill 或另一个工具身份；子任务需要新委托时由原始委托者重新签发。

### Claims 示例（synthetic / 脱敏）

以下仅展示 Claims 结构，不含真实身份或凭证。示例凭证应使用短有效期（如 10 分钟），并通过 TLS 传输；`aud` 限定执行网关，`scope` 限定工具和资源，`act` 保留原始委托者。结构契约见 [`schemas/delegation-token.schema.json`](../../schemas/delegation-token.schema.json)。

```json
{
  "iss": "https://identity.example.invalid/synthetic",
  "sub": "nhai:agent:ops-notready:7f3a",
  "aud": ["ops-execution-gateway"],
  "exp": 1794400260,
  "nbf": 1794399660,
  "jti": "delegation-synthetic-001",
  "tenant": "tenant-synthetic-a",
  "purpose": "k8s-notready-diagnosis",
  "act": { "sub": "delegator-synthetic-sre" },
  "delegation": {
    "chain": ["delegator-synthetic-sre", "nhai:agent:ops-notready:7f3a"],
    "non_transferable": true,
    "max_depth": 1
  },
  "scope": {
    "tools": ["k8s.get_node", "k8s.get_pod", "logs.query"],
    "resources": ["cluster/synthetic-a/node/node-07"],
    "environment": "prod"
  }
}
```

Claims 不是长期权限缓存。执行网关还要检查发行方、签名、`aud/exp/nbf`、租户、用途、资源范围及服务端撤销版本；发现委托撤销、角色回收或异常使用时立即拒绝。撤销传播到 PEP、审批服务和工具网关的最大延迟必须设 SLO（例如 5 秒），等待中的任务收到撤销后不得执行。

::: warning 不要给 Agent 一个“超级账号”
共享高权限账号会让事故无法归因、权限无法回收、审计无法通过。Agent 身份要像服务账号一样被治理，而不是像人的账号一样被借用。
:::

## 委托与权限模型

基础权限模型（工具、资源、环境、时间、blast radius、审批）见[第 05 章](./05-tools-permissions)。身份章额外回答三个问题：

| 维度 | 问题 |
| --- | --- |
| Principal / 委托链 | Agent 代表谁？委托是否可传递？上级权限被回收后是否立即失效？ |
| Credential | 凭证是否短时、按工具授权、不落盘、不进入 Prompt/日志？ |
| 审计与回收 | 每次调用能否回答“谁、代表谁、做了什么、谁批准”？退役时能否立即回收？ |

## OWASP Agentic Top 10（2026）

| 风险 | 在运维场景中的表现 | 控制 |
| --- | --- | --- |
| **ASI01 目标劫持** | 恶意日志/工单诱导 Agent 改变目标 | 外部内容不可信、目标与范围校验、工具 allowlist |
| **ASI02 工具滥用** | 调用了不该调用的高危工具 | 工具契约、最小权限、审批、blast radius |
| **ASI03 身份/权限滥用** | 借用高权限账号、越权访问 | NHI、短时凭证、委托、RBAC/ABAC |
| **ASI04 供应链漏洞** | 第三方 Skill/MCP Server 被投毒 | 签名/校验、来源白名单、隔离、审计 |
| **ASI05 恶意代码执行** | Agent 生成/执行恶意脚本 | 沙箱、只读挂载、egress 控制、代码审查 |
| **ASI06 记忆投毒** | 污染长期记忆/知识库，持续影响决策 | 记忆来源、TTL、隔离、写入审批 |
| **ASI07 不安全通信** | Agent 间/工具间通信被窃听/篡改 | mTLS、身份认证、最小暴露面 |
| **ASI08 级联故障** | 一个 Agent 的错误动作扩散到多系统 | 熔断、速率限制、blast radius、人工接管 |
| **ASI09 人机信任利用** | 利用审批疲劳/过度信任绕过人 | 审批包、风险分级、双人、审计 |
| **ASI10 失控 Agent** | Agent 持续运行/自我复制/逃避监管 | kill switch、预算/时长上限、行为基线、隔离 |

同时参考：OWASP LLM Top 10（2026）、Agentic Skills Top 10（AST10）、MCP Top 10（2025）；它们分别覆盖模型、技能、协议层风险。

## 威胁建模

运维 Agent 的威胁面比聊天机器人多四个：

1. **工具面**：工具参数、权限、幂等、回滚、注入。
2. **数据面**：日志/工单/网页中的恶意指令；敏感数据进入上下文。
3. **身份面**：委托链、凭证、跨租户、权限漂移。
4. **供应链面**：Skill、MCP Server、模型、依赖包、插件。

每个工具都要问：最坏情况是什么？谁批准？如何回滚？如何审计？

## 安全控制清单

### 输入/上下文

- 外部内容一律视为不可信数据，不当作指令。
- 结构化工具参数，不从自然语言拼接 shell。
- 敏感字段脱敏；跨租户隔离；上下文带来源/时间。
- 记忆写入有来源、TTL、审批；防止记忆投毒。

### 工具/执行

- 工具 allowlist + 契约 + 最小权限。
- 高危动作：双人审批、dry-run、变更窗口、回滚。
- 沙箱执行；egress 控制；只读挂载；无明文凭证。
- 速率/并发/时长/预算上限；循环检测；kill switch。

### 身份/审计

- NHI + 委托 + 短时凭证。
- 每次调用记录：谁、代表谁、工具、参数、审批、结果。
- 审计日志 append-only、可检索、可导出。
- 定期权限复核与回收；退役即回收。

### 供应链

- Skill/MCP/插件来源白名单 + 签名/哈希校验。
- 第三方代码在沙箱运行；最小网络/文件权限。
- 依赖版本锁定；升级前回归；供应链事件响应。

## 事故场景

| 场景 | 应对 |
| --- | --- |
| 日志中的恶意指令诱导 Agent 删除资源 | 拒绝、隔离、审计、更新评测集 |
| 第三方 Skill 窃取凭证 | 撤销凭证、隔离 Skill、供应链排查 |
| Agent 循环调用导致账单暴涨 | 预算/速率熔断、kill switch、根因分析 |
| Agent 越权访问其他租户 | 身份/权限审计、隔离、通知合规 |
| 审批疲劳导致人放过高危动作 | 风险分级、双人、审批包改进 |

## 本章检查清单

- [ ] Agent 有唯一 NHI、归属、委托、短时凭证吗？
- [ ] 委托是否不可传递，Claims 是否限定 audience、用途、租户与 scope？
- [ ] 策略执行与写操作审批是否都在工具调用前，拒绝路径是否经过测试？
- [ ] 委托/角色/凭证撤销是否传播到 PEP、审批服务与工具网关？
- [ ] 权限按工具/资源/环境/时间/blast radius 收紧了吗？
- [ ] 高危动作有双人审批、dry-run、回滚、审计吗？
- [ ] 外部内容被视为不可信数据吗？
- [ ] Skill/MCP/插件有来源白名单、签名、沙箱吗？
- [ ] 记忆/知识有来源、TTL、写入审批吗？
- [ ] 有 kill switch、预算/时长上限、人工接管吗？
- [ ] 是否按 OWASP Agentic Top 10 做过威胁建模与测试？

下一篇：[成本、ROI 与组合管理](./13-cost-roi-portfolio)
