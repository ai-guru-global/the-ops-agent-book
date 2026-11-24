---
title: 需求地图
description: 从工程需求回指章节、模板、Schema、参考实现与可执行验证命令。
owner: "Content Lead"
last_verified: "2026-11-25"
review_by: "2027-02-25"
content_status: "reviewed"
---

# 附录：需求地图

> 本表用于验收与检索，不替代章节中的约束。每项需求必须同时具备**设计制品、机器可读契约、证据与验证结果**；参考实现和示例均为 synthetic / desensitized，只证明工程路径，不构成生产准入证据。

## 使用约定

- **章节**是语义与验收依据；**模板**是交付物骨架；**Schema / Manifest**约束机器可读字段；**参考实现/示例**展示最小闭环；**验证命令**检查仓库中的可执行部分。
- 命令均在仓库根目录运行。自检通过不等于业务验收；生产项目还须替换真实数据、扩大样本、完成签署并归档不可变证据。
- `evidence://` 是示意证据命名空间，不是可访问协议。正式归档结构、版本、来源复核、缺席代理与退役规则见 [GOVERNANCE.md](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md)。
- 需求变更时同步更新本章、[模板导读](../templates/index)、相关 Schema 与测试；不得只改文案。

## 核心需求映射

| ID / 领域 | 工程需求与完成判定 | 章节 | 模板 / Schema / Manifest | 参考实现 / 示例 | 验证入口 |
| --- | --- | --- | --- | --- | --- |
| RM-EVD-01 证据 | 输入、来源、时间、查询结果、决策、动作、验证与版本可互相回指；无证据的结论不得作为写操作依据 | [06 上下文与知识](../guide/06-context-knowledge)、[11 AgentOps](../guide/11-agentops-observability) | [Agent 设计文档](../templates/agent-design-doc)、[Agent Event Schema](../../schemas/agent-event.schema.json) | `examples/traces/notready-trace.json`；[11 章参考实现](../guide/11-agentops-observability#参考实现) | 参考实现 Trace 验链；`npm run docs:build` |
| RM-EVD-02 证据治理 | `claim_id → source_id`、`accessed_at`、`review_by`、内容快照与 SHA-256 完整；过期事实标为待复核，不得独立支持 G3/G4 | [06 新鲜度与来源](../guide/06-context-knowledge#新鲜度与来源)、[09 治理](../guide/09-organization-governance) | [来源注册表](./source-registry)、`sources/registry.yaml`、[GOVERNANCE · 来源与事实到期](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md#4-来源复核与事实到期) | 来源注册表 claim 回指 | `python3 scripts/check_internal_links.py`；人工核对 claim/source 与快照哈希 |
| RM-EVD-03 归档 | 门禁、审批、工具、回滚与安全证据使用不可变 artifact/version；WORM 或 append-only，审计类默认保留 365 天 | [09 门禁证据与否决矩阵](../guide/09-organization-governance#门禁证据与否决矩阵)、[11 隐私与审计](../guide/11-agentops-observability#隐私采样保留与审计完整性) | [模板元信息规则](../templates/index#元信息证据与未决项规则)、[GOVERNANCE · 证据归档](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md#7-证据归档) | [失败案例的 G3 记录](./case-failed-agent#正式-g3-否决与整改闭环) | 检查 artifact/version、哈希、保留期和只读权限；`python3 scripts/check_internal_links.py` |
| RM-TOOL-01 工具契约 | `tool_id + contract_version` 唯一；输入/输出 Schema、副作用、权限、dry-run、幂等、回滚/补偿、停止条件和审计字段齐全 | [05 工具与权限](../guide/05-tools-permissions)、[11 因果与工具版本](../guide/11-agentops-observability#父子因果与工具契约版本) | [工具契约模板](../templates/tool-contract)、[Tool Contract Schema](../../schemas/tool-contract.schema.json) | `examples/cases/notready/tool-contract.drain.json`；[参考实现工具网关](../guide/11-agentops-observability#参考实现) | Schema 示例校验；参考实现正/负向工具测试 |
| RM-TOOL-02 可执行 Runbook | 步骤、输入、前置条件、断言、confidence、停止与恢复可执行；只读脚本不产生副作用 | [06 Runbook 2.0](../guide/06-context-knowledge#runbook-20)、[05 安全恢复](../guide/05-tools-permissions#不可逆动作drain-与安全恢复) | [Runbook → Tool 映射](../templates/runbook-tool-map)、[Runbook Schema](../../schemas/runbook.schema.json) | `examples/templates/runbook.yaml`、`examples/playbooks/01-k8s-readonly.sh` | Runbook Schema 校验；`bash -n examples/playbooks/*.sh` |
| RM-PERM-01 身份与最小权限 | NHI 独立可归因，凭证短时、可撤销；角色、环境、资源、动作与时限共同约束，禁止共享管理员凭证 | [12 身份与安全](../guide/12-identity-security)、[05 权限模型](../guide/05-tools-permissions#权限模型) | [权限矩阵模板](../templates/permission-matrix)、[Permission Policy Schema](../../schemas/permission-policy.schema.json) | `examples/cases/notready/permission-policy.notready.json`；参考实现 `credential-service` / `policy-engine` | 权限负向测试、撤销测试、越权拒绝测试 |
| RM-PERM-02 PEP 与审批绑定 | PEP 对读/写统一 deny-first；`plan_hash`、目标资源版本、审批人、级别、有效期绑定；关键字段变化、过期、撤销即拒绝 | [05 审批包](../guide/05-tools-permissions#审批包)、[12 PEP](../guide/12-identity-security) | [权限矩阵 · 审批绑定](../templates/permission-matrix#审批绑定规则)、Permission Policy Schema | 参考实现 `approval-service` / `tool-gateway` | 篡改计划、目标版本漂移、审批过期/撤销、写前复验必须全部拒绝 |
| RM-PERM-03 急停与可停止 | Agent 之外的 kill switch 能关闭新写入口，处理排队与在途写，并保留人工接管；不得只终止模型进程 | [08 Agent 自身的事故响应](../guide/08-operate-improve#agent-自身的事故响应)、[09 G4](../guide/09-organization-governance) | [发布与回滚清单](../templates/release-checklist)、[GOVERNANCE · 回滚与 LKG](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md#3-回滚与-lkg) | 参考实现 kill-switch / partial-success / unknown-outcome 分支 | 急停、幂等重放、在途对账、人工接管与回滚演练 |
| RM-EVAL-01 数据集与门禁 | Golden / Calibration / Holdout 隔离；当前目标 400 = 40 + 60 + 300；四类 veto 规则齐全，样本不足不得 release-ready | [07 数据集设计](../guide/07-evaluation-release#数据集设计) | [评测集模板](../templates/eval-set)、`evals/manifest.yaml`（由 `case_files` 指向案例） | `examples/templates/eval-cases.yaml`、`examples/eval-results/report.json` | `node scripts/run-evals.mjs --self-test` |
| RM-EVAL-02 指标与 Judge | Rubric 权重和为 1；Judge 校准、一致性、安全/证据召回与人工复核可复算；核心指标不得被平均分掩盖 | [07 指标与 Judge 治理](../guide/07-evaluation-release#指标基线与置信区间) | [指标库](./metrics)、[Metric Schema](../../schemas/metric.schema.json) | `examples/metrics/*.json`；`evals/manifest.yaml` | `node scripts/run-evals.mjs`；核对 veto、分区、样本量和 Judge 校准证据 |
| RM-REL-01 六类制品与 LKG | 模型、Prompt、工具、知识、策略、评测版本全部固定；LKG 不可变且通过独立健康验证 | [07 发布阶段与门禁](../guide/07-evaluation-release#发布阶段与门禁)、[08 版本管理](../guide/08-operate-improve#版本管理与变更) | [发布与回滚清单](../templates/release-checklist)、`templates/release.yaml` | 参考实现 `summarize()` 的版本与 Trace；[GOVERNANCE · 版本与发布](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md#2-版本与发布) | 六类版本 diff、LKG 恢复与恢复后验链 |
| RM-REL-02 Shadow / Canary | Shadow 不产生真实写；Canary 在门禁后产生限定真实副作用，具备数值扩量/回滚阈值与观察窗 | [07 影子权限与发布阶段](../guide/07-evaluation-release#影子权限)、[11 参考实现](../guide/11-agentops-observability#参考实现) | [发布清单 · 灰度](../templates/release-checklist#3-灰度与扩量) | 参考实现 `demo` / `shadow` / `canary` / `rollback` 场景 | 按 [11 章命令](../guide/11-agentops-observability#参考实现)运行；断言 Shadow 写副作用为 0 |
| RM-OPS-01 Trace 与完整性 | Session 可含多个 Run；Trace 描述单个 Run 的因果事件图，跨 Run 保留来源标识；sequence、父节点、前驱哈希连续且无环 | [11 Canonical Event Schema](../guide/11-agentops-observability#canonical-event-schema-v100) | [Agent Event Schema](../../schemas/agent-event.schema.json) | 参考实现 `event-store`、`examples/traces/notready-trace.json` | JSONL `verifyTrace`；篡改 payload、重排 sequence、断链必须失败 |
| RM-OPS-02 SLO 与事故 | Run 有明确终态；质量、安全、成本、可用性指标具备 Owner、窗口、动作；事故行动项经验收后方可关闭 | [08 运行契约与反馈闭环](../guide/08-operate-improve)、[11 SLO](../guide/11-agentops-observability#异常检测与-slo) | [事故复盘模板](../templates/incident-review)、`templates/incident-review.yaml`、[指标库](./metrics) | `examples/playbooks/06-incident-evidence.example.json` | 事件终态检查；指标样例 Schema 校验；复盘行动项证据抽检 |
| RM-COST-01 单位经济 | 单次模型、工具、沙箱、人工与风险成本可归因；固定/实施成本不重复计入，风险只在成本侧计一次 | [13 TCO 与单位经济](../guide/13-cost-roi-portfolio) | [Agent 设计文档 · 运营](../templates/agent-design-doc#9-运营)、[成本指标](./metrics) | `examples/cost/roi-example.json`、`examples/cost/worked-example.json` | `node scripts/cost-model.mjs --self-test` |
| RM-COST-02 ROI 与采购 | ROI、回收期、盈亏平衡和敏感性由原始输入重算；采购使用合同价、真实事件量与退出成本 | [13 ROI 与试点组合](../guide/13-cost-roi-portfolio)、[10 POC 评分卡](../guide/10-build-vs-buy#poc-评分卡) | [发布清单](../templates/release-checklist)、成本工作簿说明 | `examples/cost/worked-example.json` / `.md` | `node scripts/cost-model.mjs --check`；差异必须为 0 |
| RM-GOV-01 决策与门禁 | G0–G7 每阶段只有一个 A；证据、独立 veto 与升级路径完整；争议不能把 No-Go 自动改成 Go | [02 八道门禁](../guide/02-lifecycle#八道门禁)、[09 决策与门禁矩阵](../guide/09-organization-governance) | 七个[交付模板](../templates/index)、[GOVERNANCE](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md) | [失败 Agent 案例](./case-failed-agent) | 逐行检查 A/R/证据/veto；抽检否决、整改、复评与再准入记录 |
| RM-GOV-02 缺席与升级 | 关键角色登记 Primary/Backup；4 业务小时或声明缺席后由合格同角色 Backup 接替；安全/数据/评测/变更否决不可随意转授 | [09 缺席代理与升级](../guide/09-organization-governance#缺席代理与升级) | [GOVERNANCE · 缺席代理与升级](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md#5-缺席代理与升级) | 治理规则与联系路由登记 | 检查书面委派、资质、响应时限、升级记录与双人 break-glass |
| RM-GOV-03 退役 | 依赖、写权、NHI、委托、Secret、入口与数据处理均有 Owner 和证据；生产写授权 24 小时内 100% 回收，30 天后复查 | [08 退役](../guide/08-operate-improve#退役)、[09 退役执行矩阵](../guide/09-organization-governance#退役执行矩阵) | [GOVERNANCE · 退役](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md#6-退役)、[事故复盘](../templates/incident-review) | G7 清单与归档 | 权限/委托/Secret 回收报告、依赖扫描、数据处置凭证和 30 天复查 |
| RM-SCN-01 场景 | Charter 明确价值、非目标、风险、数据/工具就绪度、Owner 与基线；先只读，再按证据扩权 | [03 场景选择](../guide/03-scenario-selection)、[02 生命周期](../guide/02-lifecycle) | [Agent 设计文档](../templates/agent-design-doc) | [K8s NotReady 案例](./case-notready) | 场景评分与基线人工复核；G0/G1 签署检查 |
| RM-SCN-02 多场景与 POC | 场景覆盖 K8s、GPU、RDMA、数据库、KV Cache 等；POC 使用同一指标、反例与退出测试，不以 Demo 代替评测 | [POC 评分卡](../guide/10-build-vs-buy#poc-评分卡)、[场景 playbooks](../playbooks/index) | [工具契约](../templates/tool-contract)、[权限矩阵](../templates/permission-matrix) | `examples/playbooks/01-k8s-readonly.sh` 至 `06-incident-evidence.example.json` | `bash -n examples/playbooks/*.sh`；`python3 -m py_compile examples/playbooks/*.py`；SQL 只读人工审查 |
| RM-CASE-01 失败闭环 | No-Go 保留原不可变记录；整改有 Owner/验收人/期限/证据；复评生成新版本；再进入 Shadow/Canary 必须满足独立条件 | [失败 Agent 案例](./case-failed-agent)、[09 门禁矩阵](../guide/09-organization-governance#门禁证据与否决矩阵) | [评测集](../templates/eval-set)、[发布清单](../templates/release-checklist)、[GOVERNANCE](https://github.com/ai-guru-global/the-ops-agent-book/blob/main/GOVERNANCE.md) | `G3-K8S-DIAG-2026-001 v1.0.0 → v1.1.0`（synthetic） | 检查否决理由、签署角色、FA-01–06、复评指标和再准入门槛 |

## 门禁到验证的快捷索引

| 门禁 | 最小可执行验证 | 不能据此声称的事项 |
| --- | --- | --- |
| G0 / G1 | 模板字段、来源回指、Schema 示例与内部链接检查 | 真实业务价值、生产安全或法律合规 |
| G2 | 参考实现测试、工具/PEP 负向用例、Trace 验链、kill-switch 演练 | 已通过 400 例评测或可自主扩权 |
| G3 | `node scripts/run-evals.mjs --self-test`；检查 400 例 manifest、分区、Judge 与 veto | synthetic mock 结果就是真实 Agent 质量或发布证据 |
| G4 | `demo` / `shadow` / `canary` / `rollback` 场景测试、LKG 与回滚验证 | 本地 synthetic Canary 等于生产变更批准 |
| G5 / G6 | SLO/成本对账、事故复盘、同集回归与来源 `review_by` 检查 | 未经验收的行动项已关闭或产品事实永久有效 |
| G7 | 权限回收、依赖清零、数据处置与 30 天复查 | 删除进程就等于完成退役 |

## 仓库级验证

```bash
# 文档构建、资源、链接与 Mermaid 渲染
npm run docs:build
npm run validate:assets
python3 scripts/check_internal_links.py
npm run check:mermaid

# 示例脚本静态检查
bash -n examples/playbooks/*.sh
python3 -m py_compile examples/playbooks/*.py

# synthetic 评测与成本工具自检
node scripts/run-evals.mjs --self-test
node scripts/cost-model.mjs --self-test

# 成本重算；--check 在存在差异时返回非零
node scripts/cost-model.mjs --check
```

`npm run check:all` 汇总文档、资源、链接、Mermaid、参考实现 17 项测试、评测 harness 自检、成本重算与 playbook 静态检查；它**不包含**真实模型/生产 Agent 评测或生产发布验收。参考实现的运行与验链命令见[第 11 章 · 参考实现](../guide/11-agentops-observability#参考实现)。
