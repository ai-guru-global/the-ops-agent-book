---
title: Runbook → Tool 映射
description: 把传统 Runbook 转成可执行、可验证、可回滚的机器可读 Runbook。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# Runbook → Tool 映射模板

> 传统 Runbook 是“写给人看的步骤”；Runbook 2.0 是“人和 Agent 都能执行、验证、回滚的资产”。

## 0. 元信息与权威源

| 字段 | 格式约束 | 内容 |
| --- | --- | --- |
| artifact_id | `RB-<场景>-<YYYY>-<三位序号>` | `RB-k8s-2026-001` |
| 版本 / 状态 | `MAJOR.MINOR.PATCH`；draft/in_review/approved/retired | 3.0.0 / approved |
| Owner / 备份 | 团队别名，能在值班系统解析 | payments-sre / platform-oncall |
| 更新 / 复核 | ISO 8601 时间；复核日 YYYY-MM-DD | |
| 关联制品 | `ADD`、`TC`、`PMX`、`EVAL` ID + 版本 | |
| 证据归档 | `<仓库>/<artifact_id>/<版本>/<run_id>/`；不可变 | |

完整机器可读权威源：仓库根目录 `examples/templates/runbook.yaml`。结构约束：`schemas/runbook.schema.json`。下表的 ID、顺序、工具版本、输入 schema、断言和回滚引用与 YAML 一致；修改一方必须同步另一方。

**填写完成判定**：Schema 校验通过；每个 `${变量}` 已声明；`input_schema_ref` 能在 `input_schemas` 解析；`rollback_step_refs` 指向真实回滚步骤；所有 ID 唯一；approved 版有 Owner、复核日、关联制品和证据。空白、`TBD`、无原因 N/A 不通过。

## 1. 前置条件与 confidence

| 检查 | 判定表达式 | 证据 / 最大新鲜度 | 失败动作 |
| --- | --- | --- | --- |
| `target_exists` | `pod_exists && deployment_exists` | cmdb.allowlist / 10m | abort |
| `evidence_fresh` | `all_evidence_age <= 10m` | snapshot.registry / 10m | escalate |
| `no_active_incident` | `active_incident_count(namespace) == 0` | incident.api / 5m | escalate |

confidence 阈值来自 `EVAL-k8s-2026-001` v1.0.0 的 calibration 划分：600 条样本，temperature scaling + 分层可靠性桶，阈值 0.80。模型、Prompt 变化，14 天 ECE > 0.08，或安全类校准召回 < 0.98 时重新校准。低于 0.80、证据缺口、断言失败或审批超时均升级到 payments-oncall，10 分钟内响应；不得把未经校准的模型自报置信度当作阈值。

## 2. 映射表

“成功/失败”两列是断言，不是自然语言感受。`failure` 断言在工具错误时检查错误类别；其 `on_failure` 是真实处理动作。

| 步骤 ID / 类型 | 目的 | 证据（最大新鲜度） | 工具 @ 版本 | 输入 schema / 参数 | 成功断言 → 失败处理 | 失败断言 → 处理 | 审批 / 回滚 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `get_pod` / read | 确认 Pod 与重启状态 | k8s.pod_status / 2m | `k8s.get_pod` @ 2.3.0 | `k8s.get_pod`；cluster/namespace/name | name 匹配且 restartCount > 0 → escalate | RESOURCE_NOT_FOUND → abort | N/A |
| `get_events` / read | 关联事件与重启窗口 | k8s.events / 5m | `k8s.get_events` @ 2.3.0 | `k8s.get_events`；cluster/namespace/involved_object | 出现 CreateContainerConfigError → escalate | AUTH/TIMEOUT → escalate | N/A |
| `get_logs` / read | 查容器错误签名 | logs.container / 15m | `logs.query` @ 1.8.2 | `logs.query`；cluster/service/since=15m | 日志含 DATABASE_URL → escalate | AUTH/TIMEOUT → escalate | N/A |
| `get_deployment` / read | 比较配置键，不读取 Secret 值 | k8s.deployment / 5m | `k8s.get_deployment` @ 2.3.0 | `k8s.get_deployment`；cluster/namespace/name | envKeys 不含 DATABASE_URL → escalate | RESOURCE_NOT_FOUND → abort | N/A |
| `plan_patch` / plan | 生成不可变补丁，不改 Git/K8s | gitops.patch / 10m | `gitops.plan` @ 1.4.0 | `gitops.plan`；repo/patch_ref | 仅变更 patch_ref 指定文件 → abort | POLICY_DENIED → abort | N/A |
| `request_approval` / approval | 审批绑定补丁哈希与工单 | workflow.approval / 30m | `workflow.approval` @ 1.2.0 | `workflow.approval`；change_ticket/patch_hash/requested_role | approved 且哈希匹配 → abort | rejected/expired → escalate | 单人 payments-change-approver；15 分钟 |
| `commit_patch` / write | 仅提交已审批环境变量补丁 | gitops.audit / 1m | `gitops.commit` @ 1.4.0 | `gitops.commit`；repo/patch_ref/approval_id/reason | commitSha 与 approvalId 匹配 → rollback | APPROVAL_EXPIRED/POLICY_DENIED/CONFLICT → escalate | dry-run 必须；窗口；引用 `revert_patch` |
| `verify_rollout` / verify | 确认健康滚动完成 | k8s.rollout / 2m | `k8s.rollout_status` @ 2.3.0 | `k8s.rollout_status`；cluster/namespace/name | complete 且 ready ≥ desired → rollback | failed → rollback | 任一变更验证失败均回滚 |
| `verify_slo` / verify | 确认服务 SLO 恢复 | slo.window / 15m | `slo.query` @ 1.1.0 | `slo.query`；cluster/service/window=15m | errorRate ≤ 0.01 且 p95 ≤ 800ms → rollback | QUERY_TIMEOUT → escalate | RTO 15m |
| `revert_patch` / rollback | 通过 GitOps 撤销精确 commit | gitops.audit / 1m | `gitops.revert` @ 1.4.0 | `gitops.revert`；repo/commit_sha/approval_id/reason | revertSha 与原 commit 匹配 → escalate | APPROVAL_EXPIRED/CONFLICT → escalate | 原审批有效期内复用；否则人工回滚 |
| `verify_revert_diff` / verify | 确认无残留未审批 diff | gitops.diff / 2m | `gitops.diff` @ 1.4.0 | `gitops.diff`；repo/base_revision/target_revision | changedFiles 为空 → escalate | TIMEOUT → escalate | 回滚验证 |
| `verify_revert_rollout` / verify | 确认旧版本健康 | k8s.rollout / 2m | `k8s.rollout_status` @ 2.3.0 | `k8s.rollout_status`；cluster/namespace/name | complete 且 ready ≥ desired → escalate | failed/timeout → escalate | 回滚验证 |

真实变更步骤是 `plan_patch → request_approval → commit_patch`，不是“直接修复配置”。审批绑定补丁哈希，工具消费单次 approval_id；审批过期、scope 变化或哈希变化都会拒绝执行。Schema 只允许结构化 `params`，所有输入 schema 均 `additionalProperties: false`，禁止拼接 shell。

## 3. 机器可读 Runbook 关键节选

以下节选与完整 YAML 逐字段一致；输入 schema、逐步断言、全部回滚验证和元信息以 `examples/templates/runbook.yaml` 为准。

```yaml
confidence_calibration:
  source: EVAL-k8s-2026-001 calibration partition
  suite_version: v1.0.0
  sample_size: 600
  method: temperature_scaling_with_stratified_reliability_bins
  threshold: 0.8
  calibration_evidence: "eval://EVAL-k8s-2026-001/v1.0.0/calibration-report"
  recalibrate_when:
    - model_version_changes
    - prompt_version_changes
    - ece_exceeds_0.08_over_14_days
    - safety_calibration_recall_below_0.98
steps:
  - id: plan_patch
    action_class: plan
    purpose: Produce an immutable, reviewed configuration patch without changing Git or Kubernetes.
    evidence:
      - {source: gitops.patch, fresh_within: 10m, required_fields: [patchHash, changedFiles]}
    tool: gitops.plan
    tool_version: 1.4.0
    input_schema_ref: gitops.plan
    params: {repo: "${repo}", patch_ref: "${patch_ref}"}
    timeout_seconds: 30
    assertions:
      success:
        - {id: patch_scope_valid, expression: "result.changedFiles.length == 1 && result.changedFiles[0] == params.patch_ref", expected: "true", timeout_seconds: 5, on_failure: abort}
      failure:
        - {id: plan_rejected, expression: "error.code == 'POLICY_DENIED'", expected: "true", timeout_seconds: 5, on_failure: abort}
  - id: commit_patch
    action_class: write
    purpose: Commit only the approved environment-variable patch; never delete Pods or namespaces.
    evidence:
      - {source: gitops.audit, fresh_within: 1m, required_fields: [commitSha, approvalId]}
    tool: gitops.commit
    tool_version: 1.4.0
    input_schema_ref: gitops.commit
    params: {repo: "${repo}", patch_ref: "${patch_ref}", approval_id: "${request_approval.output.approvalId}", reason: "${reason}"}
    timeout_seconds: 60
    dry_run: true
    approval:
      min_approvers: 1
      roles: [payments-change-approver]
      expires_in_minutes: 15
      change_window_required: true
    rollback_step_refs: [revert_patch]
    assertions:
      success:
        - {id: commit_recorded, expression: "result.commitSha != null && result.approvalId == params.approval_id", expected: "true", timeout_seconds: 5, on_failure: rollback}
      failure:
        - {id: commit_rejected, expression: "error.code in ['APPROVAL_EXPIRED', 'POLICY_DENIED', 'CONFLICT']", expected: "true", timeout_seconds: 5, on_failure: escalate}
rollback:
  trigger:
    - "commit_patch.assertions.success failed"
    - "verify_rollout.assertions.success failed"
    - "verify_slo.assertions.success failed"
    - "kill_switch == true"
  rto_minutes: 15
  steps:
    - id: revert_patch
      action_class: rollback
      purpose: Revert the exact commit through GitOps; approval is reused only inside its original expiry.
      evidence:
        - {source: gitops.audit, fresh_within: 1m, required_fields: [revertSha, originalCommitSha]}
      tool: gitops.revert
      tool_version: 1.4.0
      input_schema_ref: gitops.revert
      params: {repo: "${repo}", commit_sha: "${commit_patch.output.commitSha}", approval_id: "${request_approval.output.approvalId}", reason: "Runbook verification failed"}
      timeout_seconds: 60
      assertions:
        success:
          - {id: revert_recorded, expression: "result.revertSha != null && result.originalCommitSha == params.commit_sha", expected: "true", timeout_seconds: 5, on_failure: escalate}
        failure:
          - {id: revert_rejected, expression: "error.code in ['APPROVAL_EXPIRED', 'CONFLICT']", expected: "true", timeout_seconds: 5, on_failure: escalate}
  verification:
    - id: verify_revert_diff
      action_class: verify
      purpose: Verify no unapproved environment diff remains.
      evidence:
        - {source: gitops.diff, fresh_within: 2m, required_fields: [changedFiles]}
      tool: gitops.diff
      tool_version: 1.4.0
      input_schema_ref: gitops.diff
      params: {repo: "${repo}", base_revision: "${base_revision}", target_revision: "${revert_patch.output.revertSha}"}
      timeout_seconds: 30
      assertions:
        success:
          - {id: revert_diff_empty, expression: "result.changedFiles.length == 0", expected: "true", timeout_seconds: 10, on_failure: escalate}
        failure:
          - {id: diff_unavailable, expression: "error.code == 'TIMEOUT'", expected: "true", timeout_seconds: 5, on_failure: escalate}
    - id: verify_revert_rollout
      action_class: verify
      purpose: Verify the prior revision is healthy after rollback.
      evidence:
        - {source: k8s.rollout, fresh_within: 2m, required_fields: [readyReplicas, availableReplicas]}
      tool: k8s.rollout_status
      tool_version: 2.3.0
      input_schema_ref: k8s.rollout_status
      params: {cluster: "${cluster}", namespace: "${namespace}", name: "${deployment}"}
      timeout_seconds: 300
      assertions:
        success:
          - {id: rollback_healthy, expression: "result.status == 'complete' && result.readyReplicas >= result.desiredReplicas", expected: "true", timeout_seconds: 300, on_failure: escalate}
        failure:
          - {id: rollback_not_healthy, expression: "result.status in ['failed', 'timeout']", expected: "true", timeout_seconds: 5, on_failure: escalate}
```

## 4. 输入、断言与回滚规则

1. **输入校验**：先解析 `${变量}`，再按 `input_schemas.<tool>` 校验；必填缺失、类型错误、额外字段或 Secret 值直接拒绝。
2. **成功断言**：读取的字段或状态满足明确条件才算成功；工具 HTTP 200 不等于业务成功。
3. **失败断言**：按错误分类处理；auth/validation 不盲目重试，retryable 才按契约限次退避，unknown 升级。
4. **写操作**：dry-run、scope、窗口、审批、幂等键、rollback ref 缺一不可；执行前重新读取状态，避免过期计划。
5. **回滚**：触发后 15 分钟内完成回滚与两项验证；审批过期或回滚本身失败必须升级，不能宣称已恢复。
6. **证据**：每步归档 snapshot_id、UTC 采样时间、raw_ref、输入/输出哈希、审批、Trace 与结果，默认保留 365 天。

## 5. 转换原则与检查清单

- 每个步骤都有**目的、证据、工具版本、输入 schema、成功/失败断言、处理动作**。
- 前置条件写清目标存在、环境正确、证据新鲜、无进行中事故。
- 变更步骤必须有 dry-run、审批、回滚引用与业务验证。
- confidence 必须来自已校准的评测划分，不用模型自报值。
- 所有参数来自结构化查询，不拼接 shell；人工接管包包含 run_id 与回滚 token。

- [ ] YAML/JSON 可解析，Runbook 通过 schema；所有引用与变量可解析。
- [ ] 映射表与 YAML 的 ID、顺序、版本、输入、断言、失败动作一致。
- [ ] 逐步有成功与失败断言；错误分类与重试上限来自工具契约。
- [ ] 写步骤有 dry-run、窗口、审批、回滚；RTO 已演练。
- [ ] confidence 校准来源、样本量、阈值和重新校准条件明确。
- [ ] 升级条件、接收人、响应时限与交接字段明确。
- [ ] Owner、版本、review_by、证据归档齐全；新事故能沉淀回 Runbook。
