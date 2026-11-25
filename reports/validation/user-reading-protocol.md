# 真实用户阅读测试协议

状态：**待真实参与者执行**。自动化构建、链接、Mermaid、响应式、无障碍和参考实现测试不能替代本测试。PUB-04 只有在真实 SRE/平台工程师完成测试、独立复核接受证据后才能关闭。

## 1. 参与者与样本边界

- 3–5 名核心 SRE/平台/AI 工程师；角色不限 `sre/platform/ai`，但能力必须至少覆盖 K8s、可观测/AIOps、AI 工程中的两类。
- 可选 1 名技术文档/UX 审稿人，角色记为 `docs`，不计入核心 3–5 人，也不进入核心任务通过率。
- 记录角色、能力类别、年限、是否做过 Agent 项目；不要求参与者读过本书。
- 本测试只描述 3–5 人样本的任务尝试结果，不作总体用户成功率推断，不计算虚假的总体置信区间。

## 2. 测试环境与版本

- 桌面：1440×900，记录 Chrome/Edge 名称与版本。
- 手机：390×844，记录真实设备或移动仿真环境。
- 打印：A4，分别检查第 05 章和 K8s 手册，记录打印/PDF 渲染器与页码证据。
- 所有参与者必须测试同一个 40 位提交 SHA；使用线上站点或与该 SHA 一致的本地构建。

## 3. 任务与计时

| 任务 | 目标时限 | 独立通过标准 |
| --- | ---: | --- |
| T1 定位 | 180 秒 | 找到第 05 章“审批绑定与重新校验”和“不可逆动作、drain 与安全恢复”，说明 uncordon 不是完整回滚 |
| T2 理解 | 300 秒 | 根据 NotReady 图说明 PDB/容量检查在 drain 前、写操作需审批与动作锁、部分成功/未知结果停止或升级 |
| T3 复用 | 900 秒 | 产出工具契约、评测案例、权限规则，并标注 non-goals、验证与回滚；六类产出均需证据引用 |
| T4 图示与窄屏 | 300 秒 | 在 390px 与 A4 分别验证图 05/16；无需缩放理解主干、滚动提示可见、图题/图注/节点/页码不裁切 |

计时从主持人读完任务开始，到参与者说出首个正确答案或达到时限结束。`first_correct_seconds` 记录首次正确；`time_seconds` 记录最终完成、停止或超时。超时必须标记 `timed_out=true`、`success=false`，并在任务时限停止；未超时但超过目标时间可记为 overtime，不自动判失败。使用主持人提示后完成不计独立成功，必须标记 `help_used=true`。

## 4. 记录字段

- 每个 T1–T4 记录独立成功、首次/最终耗时、超时、错误转向、帮助、安全误解和备注。
- T3 记录工具契约、评测案例、权限规则、non-goals、验证、回滚六类产出引用。
- T4 分别记录手机与打印的通过状态和证据引用，另记 1–5 分图示清晰度。
- 问题记录 `id/severity/location/description/status`；关闭问题必须填写 resolution。
- 记录最困惑与最有用反馈、匿名化会话记录引用、主持人和独立复核人 pseudonymous ID。

## 5. 现场脚本

1. 说明目的、数据用途与保留方式，取得同意并记录 `consent=true`。
2. 不让参与者先看章节；只给出任务描述。
3. 观察但不指导；需要帮助时记录帮助发生点，帮助后完成不计独立通过。
4. 每项任务后追问：“你刚才依据什么判断？”
5. T3 收集六类产出；T4 分别收集手机与打印证据。
6. 结束时收集最多 3 个“最困惑”与 3 个“最有用”。
7. 原始记录保存在受访问控制的仓库外位置；脱敏后每位参与者一个 YAML 文件写入 `reports/validation/user-reading-results/`。
8. 独立复核人检查会话真实性、计时、产出引用、直接标识与问题关闭，填写 `evidence_review`；复核人不得是参与者或主持人。
9. 运行 `npm run user-reading:check -- --write` 生成汇总；只有真实记录满足全部门禁才可通过。

模板：[user-reading-results.template.yaml](./user-reading-results.template.yaml)。Schema：`schemas/user-reading-result.schema.json`（v1.1）。校验器拒绝重复任务、混合提交、直接身份标识、计时矛盾、缺少 T3/T4 证据、非独立复核和未关闭的 critical/serious 问题；无记录时状态必须为 `not_executed`。

## 6. 通过标准

- 核心参与者 3–5 人，至少覆盖两类能力；可选 docs 最多 1 人。
- 总体独立任务通过率 ≥80%，且每个任务独立通过率均 ≥80%。
- 每名核心参与者至少独立通过 3/4 任务，避免个体全败被汇总平均掩盖。
- 至少 3 名核心参与者（样本不足 3 人时全部）在 15 分钟内独立完成 T3。
- 无安全语义误导：无人把 uncordon 当作完整回滚，或把审批理解为执行后补签。
- 390px 与 A4 的图题、图注、节点和页码均不裁切。
- 所有 critical/serious 问题关闭并复测；所有记录均获得独立复核 `accepted`。
- 汇总只表述“本样本任务尝试通过”，不得外推为总体用户成功率。

## 7. 结构示例

> synthetic / 非证据。以下值仅展示字段结构，不得放入真实结果目录。

```yaml
schema_version: "1.1"
participant_id: EXAMPLE-P01
role: sre
capabilities: [k8s]
years_experience: 5
agent_project_experience: true
consent: true
environment:
  desktop_browser: Chrome 130
  desktop_viewport: "1440x900"
  mobile_device: Pixel 8 emulation
  mobile_viewport: "390x844"
  print:
    checked: true
    pages: [guide/05-tools-permissions, playbooks/k8s]
    renderer: Chrome print to PDF
  site_commit_sha: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  tested_at: "2026-11-25T10:00:00.000Z"
session:
  session_id: USR-EXAMPLE-P01
  facilitator_id: FACILITATOR-01
  consent_recorded: true
  recording_ref: evidence://user-reading/EXAMPLE-P01/session
tasks:
  - id: T1
    success: true
    first_correct_seconds: 110
    time_seconds: 120
    timed_out: false
    wrong_turns: 1
    help_used: false
    safety_misunderstanding: false
  - id: T2
    success: true
    first_correct_seconds: 250
    time_seconds: 271
    timed_out: false
    wrong_turns: 0
    help_used: false
    safety_misunderstanding: false
    diagram_clarity: 4
  - id: T3
    success: true
    first_correct_seconds: 700
    time_seconds: 720
    timed_out: false
    wrong_turns: 1
    help_used: false
    safety_misunderstanding: false
    artifacts:
      tool_contract_ref: evidence://user-reading/EXAMPLE-P01/tool-contract.yaml
      eval_case_ref: evidence://user-reading/EXAMPLE-P01/eval-case.yaml
      permission_rule_ref: evidence://user-reading/EXAMPLE-P01/permission-matrix.yaml#rule-1
      non_goals_ref: evidence://user-reading/EXAMPLE-P01/design.md#non-goals
      verification_ref: evidence://user-reading/EXAMPLE-P01/design.md#verification
      rollback_ref: evidence://user-reading/EXAMPLE-P01/design.md#rollback
  - id: T4
    success: true
    first_correct_seconds: 200
    time_seconds: 210
    timed_out: false
    wrong_turns: 0
    help_used: false
    safety_misunderstanding: false
    diagram_clarity: 4
    mobile_result:
      passed: true
      evidence_ref: evidence://user-reading/EXAMPLE-P01/mobile.png
    print_result:
      passed: true
      evidence_ref: evidence://user-reading/EXAMPLE-P01/print.pdf
issues: []
feedback:
  most_confusing: []
  most_useful: []
evidence_review:
  reviewer_id: REVIEWER-01
  reviewed_at: "2026-11-25T11:00:00.000Z"
  decision: accepted
  anonymization_confirmed: true
  evidence_ref: evidence://user-reading/EXAMPLE-P01/review
```

## 8. 当前状态

协议与校验器已准备，但**未执行真实用户测试**。在取得真实参与者结果前，PUB-04 保持 `in_progress`，不得用 reviewer、axe、构建成功或 synthetic mock 代替。
