#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_INPUT = "examples/cost/roi-example.json";
const DEFAULT_JSON_OUTPUT = "examples/cost/worked-example.json";
const DEFAULT_MD_OUTPUT = "examples/cost/worked-example.md";
const ALLOWED_OVERRIDES = new Set(["resolution_rate", "review_minutes", "loaded_hourly_usd"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireNumber(object, key, label, { positive = false, max = Infinity } = {}) {
  const value = object?.[key];
  assert(typeof value === "number" && Number.isFinite(value), `${label}.${key} must be a finite number`);
  assert(value >= 0 && (!positive || value > 0) && value <= max, `${label}.${key} is outside the allowed range`);
  return value;
}

function sumValues(object) {
  return Object.values(object).reduce((sum, value) => sum + value, 0);
}

function roundNumbers(value) {
  if (Array.isArray(value)) return value.map(roundNumbers);
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, roundNumbers(item)]));
  if (typeof value === "number") return Math.round(value * 1e10) / 1e10;
  return value;
}

export function validateCostInput(input) {
  assert(isObject(input), "ROI input must be a JSON object");
  assert(typeof input.example_id === "string" && input.example_id, "example_id is required");
  assert(typeof input.currency === "string" && /^[A-Z]{3}$/.test(input.currency), "currency must be a three-letter ISO code");
  assert(input.period === "year", "This model currently accepts period=year only");
  const volume = requireNumber(input, "volume_events_per_year", "input", { positive: true });
  assert(Number.isInteger(volume), "volume_events_per_year must be an integer");
  const ui = input.unit_inputs;
  const vi = input.value_inputs;
  assert(isObject(ui) && isObject(vi), "unit_inputs and value_inputs are required");
  assert(isObject(ui.model), "unit_inputs.model is required");
  for (const key of ["input_tokens_per_event", "input_usd_per_million_tokens", "output_tokens_per_event", "output_usd_per_million_tokens"]) {
    requireNumber(ui.model, key, "unit_inputs.model");
  }
  requireNumber(ui, "tool_observability_sandbox_egress_usd_per_event", "unit_inputs");
  assert(isObject(ui.human_review), "unit_inputs.human_review is required");
  requireNumber(ui.human_review, "review_rate", "unit_inputs.human_review", { max: 1 });
  requireNumber(ui.human_review, "minutes_per_reviewed_event", "unit_inputs.human_review");
  requireNumber(ui.human_review, "loaded_usd_per_hour", "unit_inputs.human_review");
  assert(isObject(ui.risk_reserve), "unit_inputs.risk_reserve is required");
  requireNumber(ui.risk_reserve, "incident_probability_per_event", "unit_inputs.risk_reserve", { max: 1 });
  requireNumber(ui.risk_reserve, "expected_loss_usd_per_incident", "unit_inputs.risk_reserve");
  assert(isObject(ui.fixed_costs_usd_per_year) && Object.keys(ui.fixed_costs_usd_per_year).length > 0, "fixed_costs_usd_per_year must be a non-empty object");
  for (const [key, value] of Object.entries(ui.fixed_costs_usd_per_year)) requireNumber(ui.fixed_costs_usd_per_year, key, "fixed_costs_usd_per_year");
  assert(isObject(vi.manual_baseline), "value_inputs.manual_baseline is required");
  requireNumber(vi.manual_baseline, "hours_per_event", "value_inputs.manual_baseline");
  requireNumber(vi.manual_baseline, "loaded_usd_per_hour", "value_inputs.manual_baseline");
  assert(isObject(vi.agent), "value_inputs.agent is required");
  requireNumber(vi.agent, "verified_resolution_rate", "value_inputs.agent", { max: 1 });
  requireNumber(vi.agent, "hours_avoided_per_resolved_event", "value_inputs.agent");
  requireNumber(vi, "mttr_and_incident_benefits_usd_per_year", "value_inputs");
  requireNumber(vi, "toil_benefit_usd_per_year", "value_inputs");
  assert(Array.isArray(input.sensitivity), "sensitivity must be an array");
  const names = new Set();
  for (const scenario of input.sensitivity) {
    assert(isObject(scenario) && typeof scenario.case === "string" && scenario.case, "each sensitivity scenario needs a case name");
    assert(!names.has(scenario.case), `duplicate sensitivity case ${scenario.case}`);
    names.add(scenario.case);
    const overrides = Object.fromEntries(Object.keys(scenario).filter((key) => ALLOWED_OVERRIDES.has(key)).map((key) => [key, scenario[key]]));
    assert(Object.keys(overrides).length > 0, `sensitivity ${scenario.case} has no supported override`);
    for (const [key, value] of Object.entries(overrides)) {
      assert(typeof value === "number" && Number.isFinite(value) && value >= 0, `sensitivity ${scenario.case}.${key} must be non-negative`);
      if (key === "resolution_rate") assert(value <= 1, `sensitivity ${scenario.case}.resolution_rate must be <= 1`);
    }
  }
  return input;
}

export function calculateCostModel(input) {
  validateCostInput(input);
  const volume = input.volume_events_per_year;
  const ui = input.unit_inputs;
  const vi = input.value_inputs;
  const modelPerEvent = (ui.model.input_tokens_per_event * ui.model.input_usd_per_million_tokens + ui.model.output_tokens_per_event * ui.model.output_usd_per_million_tokens) / 1_000_000;
  const reviewPerEvent = ui.human_review.review_rate * ui.human_review.minutes_per_reviewed_event / 60 * ui.human_review.loaded_usd_per_hour;
  const riskPerEvent = ui.risk_reserve.incident_probability_per_event * ui.risk_reserve.expected_loss_usd_per_incident;
  const toolPerEvent = ui.tool_observability_sandbox_egress_usd_per_event;
  const variablePerEvent = modelPerEvent + reviewPerEvent + riskPerEvent + toolPerEvent;
  const fixedPerYear = sumValues(ui.fixed_costs_usd_per_year);
  const annualVariable = variablePerEvent * volume;
  const annualCost = annualVariable + fixedPerYear;
  const resolvedEvents = volume * vi.agent.verified_resolution_rate;
  const unresolvedEvents = volume - resolvedEvents;
  const recoveredCapacity = resolvedEvents * vi.agent.hours_avoided_per_resolved_event * vi.manual_baseline.loaded_usd_per_hour;
  const annualBenefits = recoveredCapacity + vi.mttr_and_incident_benefits_usd_per_year + vi.toil_benefit_usd_per_year;
  const netBenefit = annualBenefits - annualCost;
  const roi = annualCost > 0 ? netBenefit / annualCost : null;
  const manualBaseline = volume * vi.manual_baseline.hours_per_event * vi.manual_baseline.loaded_usd_per_hour;
  const residualManual = unresolvedEvents * vi.manual_baseline.hours_per_event * vi.manual_baseline.loaded_usd_per_hour;
  const agentPlusResidual = annualCost + residualManual;
  const baselineDelta = manualBaseline - agentPlusResidual;
  const otherBenefits = vi.mttr_and_incident_benefits_usd_per_year + vi.toil_benefit_usd_per_year;
  const capacityPerEvent = vi.agent.verified_resolution_rate * vi.agent.hours_avoided_per_resolved_event * vi.manual_baseline.loaded_usd_per_hour;
  const resolutionDenominator = volume * vi.agent.hours_avoided_per_resolved_event * vi.manual_baseline.loaded_usd_per_hour;
  const hourlyDenominator = volume * (vi.agent.verified_resolution_rate * vi.agent.hours_avoided_per_resolved_event - ui.human_review.review_rate * ui.human_review.minutes_per_reviewed_event / 60);
  const reviewDenominator = volume * ui.human_review.review_rate * ui.human_review.loaded_usd_per_hour;
  const nonReviewVariable = modelPerEvent + toolPerEvent + riskPerEvent;
  const implementationCost = ui.fixed_costs_usd_per_year.implementation_migration_and_ramp_amortized_first_year || 0;
  const derived = {
    model_cost_usd_per_event: modelPerEvent,
    tool_observability_sandbox_egress_usd_per_event: toolPerEvent,
    human_review_cost_usd_per_event: reviewPerEvent,
    risk_reserve_usd_per_event: riskPerEvent,
    variable_cost_usd_per_event: variablePerEvent,
    annual_variable_cost_usd: annualVariable,
    annual_fixed_cost_usd: fixedPerYear,
    annual_agent_cost_usd: annualCost,
    resolved_events_per_year: resolvedEvents,
    unresolved_events_per_year: unresolvedEvents,
    annual_recovered_capacity_value_usd: recoveredCapacity,
    annual_other_benefits_usd: vi.mttr_and_incident_benefits_usd_per_year + vi.toil_benefit_usd_per_year,
    annual_gross_benefits_usd: annualBenefits,
    annual_net_benefit_usd: netBenefit,
    roi_fraction: roi,
    all_in_cost_usd_per_event: annualCost / volume,
    all_in_cost_usd_per_successful_event: resolvedEvents > 0 ? annualCost / resolvedEvents : null,
    manual_baseline_cost_usd_per_year: manualBaseline,
    residual_manual_cost_for_unresolved_events_usd_per_year: residualManual,
    agent_plus_residual_manual_cost_usd_per_year: agentPlusResidual,
    baseline_minus_agent_plus_residual_usd_per_year: baselineDelta,
    break_even_resolution_rate: resolutionDenominator > 0 ? (annualCost - otherBenefits) / resolutionDenominator : null,
    break_even_loaded_usd_per_hour: hourlyDenominator > 0 ? (fixedPerYear + volume * nonReviewVariable - otherBenefits) / hourlyDenominator : null,
    break_even_review_minutes: reviewDenominator > 0 ? (capacityPerEvent * volume + otherBenefits - fixedPerYear - volume * nonReviewVariable) * 60 / reviewDenominator : null,
    break_even_events_per_year: capacityPerEvent - variablePerEvent > 0 ? (fixedPerYear - otherBenefits) / (capacityPerEvent - variablePerEvent) : null,
    payback_months_first_year_implementation: netBenefit > 0 ? implementationCost / (netBenefit / 12) : null,
  };
  return roundNumbers({
    derived,
    annual_cost_breakdown: {
      model: modelPerEvent * volume,
      tool_observability_sandbox_egress: toolPerEvent * volume,
      human_review: reviewPerEvent * volume,
      risk_reserve: riskPerEvent * volume,
      fixed: fixedPerYear,
      fixed_detail: { ...ui.fixed_costs_usd_per_year },
      total: annualCost,
    },
    benefit_breakdown: {
      recovered_capacity: recoveredCapacity,
      mttr_and_incident: vi.mttr_and_incident_benefits_usd_per_year,
      toil: vi.toil_benefit_usd_per_year,
      total: annualBenefits,
      accounting_basis: "Capacity value is not automatically cash savings; do not double-count the same hours as toil or MTTR labor benefit.",
    },
  });
}

function applyScenario(input, scenario) {
  const changed = structuredClone(input);
  for (const key of ALLOWED_OVERRIDES) {
    if (!(key in scenario)) continue;
    if (key === "resolution_rate") changed.value_inputs.agent.verified_resolution_rate = scenario[key];
    if (key === "review_minutes") changed.unit_inputs.human_review.minutes_per_reviewed_event = scenario[key];
    if (key === "loaded_hourly_usd") {
      changed.unit_inputs.human_review.loaded_usd_per_hour = scenario[key];
      changed.value_inputs.manual_baseline.loaded_usd_per_hour = scenario[key];
    }
  }
  return changed;
}

export function calculateSensitivity(input) {
  return input.sensitivity.map((scenario) => {
    const calculation = calculateCostModel(applyScenario(input, scenario));
    const d = calculation.derived;
    return roundNumbers({
      case: scenario.case,
      overrides: Object.fromEntries(Object.keys(scenario).filter((key) => ALLOWED_OVERRIDES.has(key)).map((key) => [key, scenario[key]])),
      annual_cost_usd: d.annual_agent_cost_usd,
      annual_benefits_usd: d.annual_gross_benefits_usd,
      annual_net_benefit_usd: d.annual_net_benefit_usd,
      roi_fraction: d.roi_fraction,
      all_in_cost_usd_per_successful_event: d.all_in_cost_usd_per_successful_event,
      residual_manual_cost_usd_per_year: d.residual_manual_cost_for_unresolved_events_usd_per_year,
      baseline_minus_agent_plus_residual_usd_per_year: d.baseline_minus_agent_plus_residual_usd_per_year,
    });
  });
}

export function reconcile(input, calculation, sensitivity) {
  const mismatches = [];
  let checked = 0;
  for (const [key, declared] of Object.entries(input.derived || {})) {
    if (typeof declared !== "number" || !(key in calculation.derived)) continue;
    checked += 1;
    const actual = calculation.derived[key];
    const tolerance = Math.max(1e-6, Math.abs(declared) * 1e-8);
    if (actual === null || Math.abs(actual - declared) > tolerance) mismatches.push({ section: "derived", field: key, declared, recomputed: actual });
  }
  let sensitivityChecked = 0;
  for (const [index, scenario] of input.sensitivity.entries()) {
    for (const [declaredKey, actualKey] of [["annual_cost_usd", "annual_cost_usd"], ["roi_fraction", "roi_fraction"]]) {
      if (typeof scenario[declaredKey] !== "number") continue;
      sensitivityChecked += 1;
      const actual = sensitivity[index][actualKey];
      const tolerance = Math.max(1e-6, Math.abs(scenario[declaredKey]) * 1e-8);
      if (actual === null || Math.abs(actual - scenario[declaredKey]) > tolerance) {
        mismatches.push({ section: `sensitivity[${index}]`, field: declaredKey, declared: scenario[declaredKey], recomputed: actual });
      }
    }
  }
  return { derived_fields_checked: checked, sensitivity_fields_checked: sensitivityChecked, all_match: mismatches.length === 0, mismatches };
}

export function buildCostReport(input, sourcePath = DEFAULT_INPUT) {
  const calculation = calculateCostModel(input);
  const sensitivity = calculateSensitivity(input);
  const reconciliation = reconcile(input, calculation, sensitivity);
  const sourceBytes = fs.readFileSync(path.resolve(ROOT, sourcePath));
  return roundNumbers({
    synthetic: true,
    demonstration_only: true,
    disclaimer: "Synthetic financial demonstration, not a vendor quote, invoice, realized saving, or procurement approval.",
    source: { path: sourcePath, sha256: createHash("sha256").update(sourceBytes).digest("hex") },
    example_id: input.example_id,
    currency: input.currency,
    period: input.period,
    input_status: input.status,
    volume_events_per_year: input.volume_events_per_year,
    inputs: { unit_inputs: structuredClone(input.unit_inputs), value_inputs: structuredClone(input.value_inputs) },
    formula_contract: {
      model_per_event: "(input_tokens × input_price + output_tokens × output_price) / 1,000,000",
      review_per_event: "review_rate × minutes / 60 × loaded_hourly",
      risk_per_event: "incident_probability × expected_loss",
      annual_cost: "events × (model + tools + review + risk) + fixed",
      recovered_capacity: "events × verified_resolution_rate × hours_avoided × manual_loaded_hourly",
      roi: "(capacity + non-overlapping other benefits − annual_cost) / annual_cost",
      residual_manual: "events × (1 − verified_resolution_rate) × manual_hours × manual_loaded_hourly",
      break_even_resolution: "(annual_cost − other_annual_benefits) / (events × hours_avoided × manual_loaded_hourly)",
      break_even_hourly: "(fixed + events × non_review_variable − other_annual_benefits) / (events × (resolution_rate × hours_avoided − review_rate × review_minutes / 60))",
      break_even_review_minutes: "(events × resolution_rate × hours_avoided × review_loaded_hourly + other_annual_benefits − fixed − events × non_review_variable) × 60 / (events × review_rate × review_loaded_hourly)",
      break_even_events: "(fixed − other_annual_benefits) / (resolution_rate × hours_avoided × manual_loaded_hourly − variable_per_event)",
    },
    ...calculation,
    sensitivity,
    reconciliation,
    limitations: [
      "All inputs are synthetic; no vendor billing or production telemetry was used.",
      "Recovered capacity is not cash unless staffing, overtime, or avoided spend is actually realized.",
      "The same labor hour must not be counted again as toil or MTTR benefit.",
      "Risk reserve is charged once on the cost side; do not deduct the same expected loss again from benefits.",
      "Fixed costs are already annual values; implementation/migration/ramp is amortized in year one.",
      "Sensitivity changes one assumption at a time; loaded_hourly_usd changes both review and manual-baseline hourly rates.",
    ],
  });
}

function money(value, digits = 2) {
  if (value === null || value === undefined) return "N/A";
  const formatted = `$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  return value < 0 ? `-${formatted}` : formatted;
}

function decimal(value, digits = 2) {
  return value === null || value === undefined ? "N/A" : value.toFixed(digits);
}

function percent(value) {
  return value === null || value === undefined ? "N/A" : `${(value * 100).toFixed(2)}%`;
}

export function renderCostMarkdown(report) {
  const d = report.derived;
  const ui = report.inputs.unit_inputs;
  const vi = report.inputs.value_inputs;
  const fixedEntries = Object.entries(ui.fixed_costs_usd_per_year);
  const lines = [
    "# 运维 Agent 成本模型：可复算 synthetic 示例",
    "",
    "> **合成演示，不是厂商报价或真实运行结果。** 本文件由 `scripts/cost-model.mjs` 从 `examples/cost/roi-example.json` 的输入重算；原输入的 `derived` 与 `sensitivity` 只用于交叉校验，不参与计算。金额为 USD，周期为年。",
    "",
    `- 示例：\`${report.example_id}\``,
    `- 输入 SHA-256：\`${report.source.sha256}\``,
    `- 输入状态：${report.input_status}`,
    `- 重算与输入声明的一致性：**${report.reconciliation.all_match ? "全部匹配" : "存在差异"}**`,
    "",
    "## 1.  frozen 输入",
    "",
    "| 输入 | 值 |",
    "| --- | ---: |",
    `| 年事件量 | ${report.volume_events_per_year.toLocaleString("en-US")} |`,
    `| Input tokens/event；单价/1M | ${ui.model.input_tokens_per_event.toLocaleString("en-US")}；${money(ui.model.input_usd_per_million_tokens)} |`,
    `| Output tokens/event；单价/1M | ${ui.model.output_tokens_per_event.toLocaleString("en-US")}；${money(ui.model.output_usd_per_million_tokens)} |`,
    `| 工具/观测/沙箱/出口 | ${money(ui.tool_observability_sandbox_egress_usd_per_event)}/event |`,
    `| 人工复核 | ${percent(ui.human_review.review_rate)} × ${ui.human_review.minutes_per_reviewed_event} 分钟 × ${money(ui.human_review.loaded_usd_per_hour)}/小时 |`,
    `| 风险准备 | ${percent(ui.risk_reserve.incident_probability_per_event)} × ${money(ui.risk_reserve.expected_loss_usd_per_incident)}/事故 |`,
    ...fixedEntries.map(([key, value]) => `| 固定成本：${key} | ${money(value)} |`),
    `| 人工基线 | ${vi.manual_baseline.hours_per_event} 小时/event × ${money(vi.manual_baseline.loaded_usd_per_hour)}/小时 |`,
    `| Agent 假设 | 验证解决率 ${percent(vi.agent.verified_resolution_rate)}；每解决事件避免 ${vi.agent.hours_avoided_per_resolved_event} 小时 |`,
    `| 其他收益 | MTTR/事故 ${money(vi.mttr_and_incident_benefits_usd_per_year)}；Toil ${money(vi.toil_benefit_usd_per_year)} |`,
    "",
    "## 2. 单位成本重算",
    "",
    "```text",
    `模型 = ${ui.model.input_tokens_per_event.toLocaleString("en-US")}/1,000,000×${money(ui.model.input_usd_per_million_tokens)} + ${ui.model.output_tokens_per_event.toLocaleString("en-US")}/1,000,000×${money(ui.model.output_usd_per_million_tokens)} = ${money(d.model_cost_usd_per_event, 4)}/event`,
    `复核 = ${percent(ui.human_review.review_rate)}×${ui.human_review.minutes_per_reviewed_event}/60×${money(ui.human_review.loaded_usd_per_hour)} = ${money(d.human_review_cost_usd_per_event, 4)}/event`,
    `风险 = ${percent(ui.risk_reserve.incident_probability_per_event)}×${money(ui.risk_reserve.expected_loss_usd_per_incident)} = ${money(d.risk_reserve_usd_per_event, 4)}/event`,
    `可变 = 模型 + 工具 + 复核 + 风险 = ${money(d.variable_cost_usd_per_event, 4)}/event`,
    "```",
    "",
    "| 项目 | USD/event | 年 USD |",
    "| --- | ---: | ---: |",
    `| 模型 | ${money(d.model_cost_usd_per_event, 4)} | ${money(report.annual_cost_breakdown.model)} |`,
    `| 工具/观测/沙箱/出口 | ${money(d.tool_observability_sandbox_egress_usd_per_event, 4)} | ${money(report.annual_cost_breakdown.tool_observability_sandbox_egress)} |`,
    `| 人工复核 | ${money(d.human_review_cost_usd_per_event, 4)} | ${money(report.annual_cost_breakdown.human_review)} |`,
    `| 风险准备 | ${money(d.risk_reserve_usd_per_event, 4)} | ${money(report.annual_cost_breakdown.risk_reserve)} |`,
    `| 可变合计 | ${money(d.variable_cost_usd_per_event, 4)} | ${money(d.annual_variable_cost_usd)} |`,
    `| 固定合计 | — | ${money(d.annual_fixed_cost_usd)} |`,
    `| **Agent 年成本 C** | — | **${money(d.annual_agent_cost_usd)}** |`,
    "",
    "## 3. 收益、ROI 与人工基线交叉校验",
    "",
    `- 年解决事件：${d.resolved_events_per_year.toLocaleString("en-US")}；未解决：${d.unresolved_events_per_year.toLocaleString("en-US")}。`,
    `- 释放容量价值 B = ${report.volume_events_per_year}×${percent(vi.agent.verified_resolution_rate)}×${vi.agent.hours_avoided_per_resolved_event}×${money(vi.manual_baseline.loaded_usd_per_hour)} = **${money(d.annual_recovered_capacity_value_usd)}**。`,
    `- 其他不重叠收益 = **${money(d.annual_other_benefits_usd)}**；毛收益 = **${money(d.annual_gross_benefits_usd)}**。`,
    `- 净收益 = B − C = **${money(d.annual_net_benefit_usd)}**；ROI = 净收益/C = **${percent(d.roi_fraction)}**。`,
    "",
    "| 单位经济 | 结果 |",
    "| --- | ---: |",
    `| 每事件全成本（失败事件保留） | ${money(d.all_in_cost_usd_per_event)} |`,
    `| 每成功事件全成本 | ${money(d.all_in_cost_usd_per_successful_event)} |`,
    `| 人工基线年成本 | ${money(d.manual_baseline_cost_usd_per_year)} |`,
    `| 未解决事件残余人工成本 | ${money(d.residual_manual_cost_for_unresolved_events_usd_per_year)} |`,
    `| Agent + 残余人工 | ${money(d.agent_plus_residual_manual_cost_usd_per_year)} |`,
    `| 基线 −（Agent + 残余人工） | ${money(d.baseline_minus_agent_plus_residual_usd_per_year)} |`,
    "",
    "最后一行应等于净收益；它防止只计算机器人成本而漏掉未解决事件的人工成本。**释放容量不等于现金节省**，未兑现时应标注“容量口径”。",
    "",
    "## 4. 敏感性（单变量）",
    "",
    "| 场景 | 年成本 C | 年收益 B | 净收益 | ROI | 每成功事件成本 |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...report.sensitivity.map((scenario) => `| ${scenario.case} | ${money(scenario.annual_cost_usd)} | ${money(scenario.annual_benefits_usd)} | ${money(scenario.annual_net_benefit_usd)} | ${percent(scenario.roi_fraction)} | ${money(scenario.all_in_cost_usd_per_successful_event)} |`),
    "",
    "`loaded_hourly_usd` 同时改变复核与人工基线的小时成本；`review_minutes` 只改变复核分钟；解决率同时改变释放容量与残余人工，但不改变 Agent 年成本。盈亏平衡小时成本联立成本侧与收益侧，不能只对 Agent 成本求倒数。",
    "",
    "## 5. 盈亏平衡",
    "",
    "| 变量 | 盈亏平衡点 | 解释 |",
    "| --- | ---: | --- |",
    `| 验证解决率 | ${percent(d.break_even_resolution_rate)} | 低于此值 ROI 为负 |`,
    `| loaded 人力成本 | ${money(d.break_even_loaded_usd_per_hour)}/小时 | 其他输入不变 |`,
    `| 每事件复核分钟 | ${decimal(d.break_even_review_minutes)} 分钟 | 其他输入不变 |`,
    `| 年事件量 | ${d.break_even_events_per_year === null ? "N/A" : `${decimal(d.break_even_events_per_year)}（约 ${Math.ceil(d.break_even_events_per_year)}）`} | 固定成本分摊变化 |`,
    `| 首年实施投入回收期 | ${d.payback_months_first_year_implementation === null ? "N/A" : `${d.payback_months_first_year_implementation.toFixed(2)} 个月`} | 以健康月份净收益线性估算 |`,
    "",
    "## 6. 复核与使用限制",
    "",
    `- 检查原输入 ${report.reconciliation.derived_fields_checked} 个 derived 数值、${report.reconciliation.sensitivity_fields_checked} 个敏感性数值。`,
    `- 差异数：${report.reconciliation.mismatches.length}。`,
    "- 风险准备只在成本侧计一次；不得在收益侧重复扣同一期望损失。",
    "- 同一人工小时不得同时计为容量、Toil 和 MTTR 人工收益。",
    "- 固定成本已按年给出；实施/迁移/爬坡已在首年摊销，不重复计入。",
    "- 采购应替换为合同价格、真实事件量、审计账单、人工基线与退出成本，并保留悲观/基准/乐观情景。",
    "",
  ];
  if (report.reconciliation.mismatches.length) {
    lines.push("### 重算差异", "", "| 位置 | 字段 | 输入声明 | 重算 |", "| --- | --- | ---: | ---: |", ...report.reconciliation.mismatches.map((item) => `| ${item.section} | ${item.field} | ${item.declared} | ${item.recomputed} |`), "");
  }
  return lines.join("\n");
}

export function runCostSelfTest() {
  const tests = [];
  const check = (name, fn) => {
    try {
      fn();
      tests.push({ name, passed: true });
    } catch (error) {
      tests.push({ name, passed: false, error: error.message });
    }
  };
  const inputPath = path.join(ROOT, DEFAULT_INPUT);
  const before = fs.readFileSync(inputPath);
  const input = JSON.parse(before.toString("utf8"));
  const report = buildCostReport(input);
  const d = report.derived;
  check("base model, review, risk, variable and annual cost recompute", () => {
    assert(Math.abs(d.model_cost_usd_per_event - 0.018) < 1e-10, "model cost mismatch");
    assert(Math.abs(d.human_review_cost_usd_per_event - 3.3333333333) < 1e-9, "review cost mismatch");
    assert(Math.abs(d.risk_reserve_usd_per_event - 2) < 1e-10, "risk mismatch");
    assert(Math.abs(d.annual_agent_cost_usd - 31270.8) < 1e-8, "annual cost mismatch");
  });
  check("benefit, ROI and manual-baseline cross-check recompute", () => {
    assert(Math.abs(d.annual_recovered_capacity_value_usd - 38400) < 1e-8, "capacity value mismatch");
    assert(Math.abs(d.annual_net_benefit_usd - 7129.2) < 1e-8, "net benefit mismatch");
    assert(Math.abs(d.roi_fraction - 0.2279826547) < 1e-9, "ROI mismatch");
    assert(Math.abs(d.baseline_minus_agent_plus_residual_usd_per_year - d.annual_net_benefit_usd) < 1e-8, "baseline cross-check mismatch");
  });
  check("break-even resolution, hourly, review, volume and payback recompute", () => {
    assert(Math.abs(d.break_even_resolution_rate - 0.651475) < 1e-9, "resolution break-even mismatch");
    assert(Math.abs(d.break_even_loaded_usd_per_hour - 64.3314285714) < 1e-8, "hourly break-even mismatch");
    assert(Math.abs(d.break_even_review_minutes - 45.646) < 1e-8, "review break-even mismatch");
    assert(Math.abs(d.break_even_events_per_year - 478.2346310192) < 1e-8, "volume break-even mismatch");
    assert(Math.abs(d.payback_months_first_year_implementation - 16.8321831342) < 1e-8, "payback mismatch");
  });
  check("all declared derived and sensitivity values reconcile", () => assert(report.reconciliation.all_match, JSON.stringify(report.reconciliation.mismatches)));
  check("zero resolution or zero review rate returns null instead of dividing by zero", () => {
    const zero = structuredClone(input);
    zero.value_inputs.agent.verified_resolution_rate = 0;
    zero.unit_inputs.human_review.review_rate = 0;
    const result = calculateCostModel(zero).derived;
    assert(result.all_in_cost_usd_per_successful_event === null, "successful-event cost should be null");
    assert(result.break_even_loaded_usd_per_hour === null, "hourly break-even should be null");
    assert(result.break_even_review_minutes === null, "review break-even should be null");
  });
  check("original ROI input remains byte-for-byte unchanged", () => assert(before.equals(fs.readFileSync(inputPath)), "input file changed"));
  const passed = tests.every((test) => test.passed);
  return { passed, tests };
}

function usage() {
  console.log(`Usage: node scripts/cost-model.mjs [--self-test] [--check] [--input PATH] [--json-out PATH] [--md-out PATH]\nDefaults: ${DEFAULT_INPUT} -> ${DEFAULT_JSON_OUTPUT} + ${DEFAULT_MD_OUTPUT}`);
}

function parseArgs(args) {
  const options = { selfTest: false, check: false, input: DEFAULT_INPUT, jsonOut: DEFAULT_JSON_OUTPUT, mdOut: DEFAULT_MD_OUTPUT };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--self-test") options.selfTest = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (["--input", "--json-out", "--md-out"].includes(arg)) {
      const value = args[++index];
      assert(value && !value.startsWith("--"), `${arg} requires a path`);
      if (arg === "--input") options.input = value;
      if (arg === "--json-out") options.jsonOut = value;
      if (arg === "--md-out") options.mdOut = value;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  if (options.selfTest) {
    const result = runCostSelfTest();
    for (const test of result.tests) console.log(`${test.passed ? "PASS" : "FAIL"} ${test.name}${test.error ? `: ${test.error}` : ""}`);
    console.log(`Cost self-test: ${result.tests.filter((test) => test.passed).length}/${result.tests.length} passed. No output files written.`);
    if (!result.passed) process.exitCode = 1;
    return;
  }
  const inputPath = path.resolve(ROOT, options.input);
  const jsonPath = path.resolve(ROOT, options.jsonOut);
  const mdPath = path.resolve(ROOT, options.mdOut);
  assert(inputPath !== jsonPath && inputPath !== mdPath, "Output paths must not overwrite the ROI input");
  assert(jsonPath !== mdPath, "JSON and Markdown output paths must differ");
  const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const report = buildCostReport(input, options.input);
  const markdown = renderCostMarkdown(report);
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(mdPath, markdown);
  console.log(`Synthetic cost example: annual cost ${money(report.derived.annual_agent_cost_usd)}, net benefit ${money(report.derived.annual_net_benefit_usd)}, ROI ${percent(report.derived.roi_fraction)}.`);
  console.log(`Reconciliation: ${report.reconciliation.all_match ? "all declared values match" : `${report.reconciliation.mismatches.length} mismatch(es)`}. Original ROI input unchanged.`);
  console.log(`Wrote ${options.jsonOut} and ${options.mdOut}. Synthetic demonstration only.`);
  if (!report.reconciliation.all_match && options.check) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
