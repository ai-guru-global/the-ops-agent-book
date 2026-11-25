# 真实用户阅读测试协议

状态：**待真实参与者执行**自动化构建、链接、Mermaid、响应式、无障碍和参考实现测试不能替代本测试。PUB-04 只有在本协议被真实 SRE/平台工程师执行并留下证据后才能关闭。

## 1. 参与者

- 3–5 名 SRE/平台工程师，至少覆盖 K8s、可观测/AIOps、AI 工程中的两类角色。
- 可选 1 名技术文档/UX 审稿人。
- 不要求参与者读过本书；记录角色、年限、是否做过 Agent 项目。

## 2. 测试环境

- 桌面：1440×900，Chrome/Edge 最新版。
- 手机：390×844，真实触屏或移动仿真。
- 打印：A4，至少检查第 05 章和 K8s 手册。
- 使用线上站点或与提交 SHA 一致的本地构建。

## 3. 任务

### T1 定位（目标 ≤ 3 分钟）

“找到写操作为什么必须先审批、批准后为什么还要重新校验，并指出 drain 的回滚边界。”

通过标准：定位到第 05 章“审批绑定与重新校验”和“不可逆动作、drain 与安全恢复”，能说明 uncordon 不是完整回滚。

### T2 理解（目标 ≤ 5 分钟）

“根据 K8s NotReady 图，说明 Agent 在证据不足时会做什么，什么条件下才能进入 drain。”

通过标准：指出 PDB/容量检查在 drain 前、写操作需要审批与动作锁、部分成功/未知结果会停止或升级。

### T3 复用（目标 ≤ 15 分钟）

“选择一个你熟悉的只读诊断场景，用工具契约、评测集和权限矩阵模板写出最小交付物。”

通过标准：产出至少 1 个工具契约、1 条评测案例、1 行权限规则；能标注 non-goals、验证和回滚。

### T4 图示与窄屏（目标 ≤ 5 分钟）

“在 390px 手机上阅读图 05 状态机和图 16 K8s 诊断流；在 A4 打印中查看同一页。”

通过标准：无需缩放即可理解主干流程；能发现横向滚动提示；图题、图注、节点和页码不裁切。

## 4. 记录指标

| 指标 | 记录方式 |
| --- | --- |
| 任务成功率 | 每个 T1–T4 独立判定 |
| 完成时间 | 秒/分钟，记录首次正确与最终正确 |
| 定位错误 | 点了哪些错误章节/链接 |
| 理解错误 | 复述中的关键偏差 |
| 图示可读性 | 1–5 分 + 具体看不清的节点 |
| 复用障碍 | 字段含义、Schema、示例、工具命名问题 |
| 主观体验 | SUS 或 5 题 1–5 分量表 |
| 严重缺陷 | 安全语义误导、找不到回滚、图中分支矛盾 |

## 5. 现场脚本

1. 说明目的与数据用途，取得同意。
2. 不让参与者先看章节；只给出任务描述。
3. 观察但不指导；需要帮助时记录帮助发生点。
4. 每项任务后追问：“你刚才依据什么判断？”
5. 结束时收集 3 个“最困惑”与 3 个“最有用”。
6. 将结果脱敏后写入 `reports/validation/user-reading-results/`，每位参与者一个 YAML 文件；原始记录不提交 git。
7. 运行 `npm run user-reading:check -- --write` 生成汇总；只有真实记录满足全部门禁才可通过。

模板：[user-reading-results.template.yaml](./user-reading-results.template.yaml)。Schema：`schemas/user-reading-result.schema.json`。校验器会拒绝重复任务、混合提交、直接身份标识和未关闭的 critical/serious 问题；无记录时状态必须为 `not_executed`。

## 6. 通过标准

- T1–T4 总体成功率 ≥ 80%。
- 无安全语义误导：无人把 uncordon 当作完整回滚，或把审批理解为执行后补签。
- 390px 与 A4 无图题/图注/页码裁切。
- 至少 3/5 参与者能在 15 分钟内产出最小工具契约与评测案例。
- 所有 critical/serious 问题关闭后复测。

## 7. 证据模板

```yaml
participant_id: synthetic-or-real-id
role: sre/platform/ai/docs
years_experience: 5
tasks:
  - id: T1
    success: true
    time_seconds: 142
    wrong_turns: 1
    safety_misunderstanding: false
  - id: T2
    success: true
    time_seconds: 271
    diagram_clarity: 4
issues:
  - id: UXR-001
    severity: moderate
    location: guide/05-tools-permissions#审批绑定与重新校验
    quote: "uncordon 是否恢复 Pod 原节点？"
    resolution: open
```

## 8. 当前状态

协议已准备，但**未执行真实用户测试**。在取得真实参与者结果前，PUB-04 保持 `planned` 或 `in_progress`，不得用 reviewer、axe、构建成功或 synthetic mock 代替。
