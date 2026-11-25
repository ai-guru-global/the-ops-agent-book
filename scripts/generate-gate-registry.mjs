#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const MANIFEST = path.join(ROOT, "evals/manifest.yaml");
const TARGET = path.join(ROOT, "docs/appendix/metrics.md");
const BEGIN = "<!-- BEGIN GENERATED GATE REGISTRY -->";
const END = "<!-- END GENERATED GATE REGISTRY -->";

function pct(value) {
  return `${(Number(value) * 100).toFixed(Number(value) === 0 ? 0 : 1).replace(/\.0$/, "")}%`;
}

function render(manifest) {
  const profiles = manifest.gate_profiles;
  const metrics = manifest.metrics;
  if (!profiles || !metrics) throw new Error("manifest gate_profiles and metrics are required");
  const rows = [
    ["G3", "加权总分", `≥ ${manifest.rubric.pass_score}`],
    ["G3", "Top-3 根因命中", `≥ ${pct(metrics.root_cause_top3_min)}`],
    ["G3", "工具参数正确率", `≥ ${pct(metrics.tool_parameter_accuracy_min)}`],
    ["G3", "证据引用准确率", `≥ ${pct(metrics.evidence_reference_accuracy_min)}`],
    ["G3", "人工接管率", `≤ ${pct(metrics.human_takeover_rate_max)}`],
    ["G3", "单 Run 平均成本", `≤ $${Number(metrics.average_cost_usd_per_run_max).toFixed(2)}`],
    ["G3", "不安全动作 / 禁止动作", "0 / 0；任一发生即 veto"],
    ["G3", "suite / Judge", `${profiles.G3.suite_cases} 条（${profiles.G3.golden_cases}/${profiles.G3.calibration_cases}/${profiles.G3.holdout_cases}）；独立 Judge ${profiles.G3.independent_judge_cases} 条`],
    ["G3", "Judge 验收", `一致率 ≥ ${pct(profiles.G3.minimum_judge_agreement)}；κ ≥ ${profiles.G3.minimum_cohens_kappa}；安全/证据召回 ≥ ${pct(profiles.G3.minimum_safety_recall)}`],
    ["G4", "Shadow", `≥ ${profiles.G4.shadow_min_runs} Run 且连续 ${profiles.G4.shadow_min_days} 天`],
    ["G4", "建议模式", `≥ ${profiles.G4.suggestion_min_runs} Run 且连续 ${profiles.G4.suggestion_min_days} 天`],
    ["G4", "受控执行", `≥ ${profiles.G4.controlled_write_min_changes} 个真实写变更且连续 ${profiles.G4.controlled_write_min_hours} 小时`],
    ["G4", "变更成功 / 自动回滚", `≥ ${pct(profiles.G4.controlled_change_success_min)}；< ${pct(profiles.G4.controlled_change_success_rollback_below)} 自动回滚`],
    ["G4", "审批审计 / 回滚就绪", `${pct(profiles.G4.approval_audit_completeness)}；≤ ${profiles.G4.rollback_ready_max_minutes} 分钟`],
    ["G5", "运营观察窗", `连续 ${profiles.G5.window_days} 天且 ≥ ${profiles.G5.minimum_runs} Run`],
    ["G5", "可用性 / 接管率", `≥ ${pct(profiles.G5.availability_min)}；≤ ${pct(profiles.G5.human_takeover_rate_max)}`],
    ["G5", "不安全动作", "0；任一 Agent 相关 SEV-1/2 即取消生产资格"],
    ["G6", "核心指标非劣", `下降不超过 ${pct(profiles.G6.core_metric_max_regression)}；关键场景新增失败 = ${profiles.G6.critical_scenario_new_failures_max}`],
    ["G6", "候选回滚", `≤ ${profiles.G6.candidate_rollback_max_minutes} 分钟；通过后重跑 ${profiles.G6.rerun_required_gates.join("/")}`],
  ];
  return [
    BEGIN,
    "## 0. 唯一门禁注册表（自动生成）",
    "",
    `来源：\`evals/manifest.yaml\` · \`gate_profiles.registry_version=${profiles.registry_version}\`。本表由 \`scripts/generate-gate-registry.mjs\` 生成，CI 检查漂移；修改数值只能改 manifest 并重新生成。运营告警可以更严格，但不能替代门禁。样本不足一律为 \`INCONCLUSIVE\`。`,
    "",
    "| 门禁 | 项目 | 当前冻结门槛 |",
    "| --- | --- | --- |",
    ...rows.map((row) => `| ${row.join(" | ")} |`),
    "",
    "G3/G4 的接管率门槛与 G5 的持续生产资格不同：前者评价候选是否可进入下一阶段，后者要求稳定运营。场景只能收紧，不能放宽安全、审计、回滚与人类责任。",
    "",
    END,
  ].join("\n");
}

export function generateGateRegistry({ check = false } = {}) {
  const manifest = parse(fs.readFileSync(MANIFEST, "utf8"));
  const section = render(manifest);
  const current = fs.readFileSync(TARGET, "utf8");
  const start = current.indexOf(BEGIN);
  const end = current.indexOf(END);
  if (start < 0 || end < 0 || end < start) throw new Error("gate registry markers are missing from docs/appendix/metrics.md");
  const next = `${current.slice(0, start)}${section}${current.slice(end + END.length)}`;
  if (check) {
    if (next !== current) throw new Error("generated gate registry is stale; run npm run gates:generate");
    return { status: "current", version: manifest.gate_profiles.registry_version };
  }
  fs.writeFileSync(TARGET, next);
  return { status: "generated", version: manifest.gate_profiles.registry_version };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(generateGateRegistry({ check: process.argv.includes("--check") }));
}
