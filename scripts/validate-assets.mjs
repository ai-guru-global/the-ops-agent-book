#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const root = process.cwd();
const errors = [];
const warnings = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function readYaml(file) {
  return parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map();
for (const file of walk("schemas").filter((f) => f.endsWith(".json"))) {
  const schema = readJson(file);
  try {
    ajv.addSchema(schema, schema.$id || file);
    validators.set(path.basename(file), ajv.getSchema(schema.$id || file));
  } catch (error) {
    errors.push(`schema ${file}: ${error.message}`);
  }
}

function validate(file, schemaName, data = readJson(file)) {
  const validate = validators.get(schemaName);
  if (!validate) {
    errors.push(`missing validator ${schemaName}`);
    return;
  }
  if (!validate(data)) {
    errors.push(`${file} failed ${schemaName}: ${ajv.errorsText(validate.errors)}`);
  }
}

validate("examples/cases/notready/tool-contract.drain.json", "tool-contract.schema.json");
validate("examples/cases/notready/permission-policy.notready.json", "permission-policy.schema.json");
for (const file of walk("examples/metrics").filter((f) => f.endsWith(".json"))) {
  validate(file, "metric.schema.json");
}
const trace = readJson("examples/traces/notready-trace.json");
validate("examples/traces/notready-trace.json", "agent-event.schema.json", trace);
const traceForHash = structuredClone(trace);
delete traceForHash.integrity.event_hash;
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}
const traceHash = createHash("sha256")
  .update(JSON.stringify(canonical(traceForHash)))
  .digest("hex");
if (traceHash !== trace.integrity.event_hash) errors.push("agent trace event_hash mismatch");

for (const mode of ["demo", "shadow", "canary", "rollback"]) {
  const dir = `examples/reference-agent/sample-output/${mode}`;
  const summary = readJson(`${dir}/summary.json`);
  const events = fs.readFileSync(path.join(root, dir, "trace.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
  let previousHash = null;
  for (const [index, event] of events.entries()) {
    validate(`${dir}/trace.jsonl[${index}]`, "agent-event.schema.json", event);
    if (event.sequence !== index + 1) errors.push(`${dir}: sequence mismatch at ${index}`);
    if (event.integrity.prev_event_hash !== previousHash) errors.push(`${dir}: prev hash mismatch at ${index}`);
    const withoutHash = canonical(event);
    delete withoutHash.integrity.event_hash;
    const hash = createHash("sha256").update(JSON.stringify(withoutHash)).digest("hex");
    if (hash !== event.integrity.event_hash) errors.push(`${dir}: event hash mismatch at ${index}`);
    previousHash = event.integrity.event_hash;
  }
  if (!summary.trace?.verified || summary.trace.event_count !== events.length) errors.push(`${dir}: summary trace mismatch`);
  if (mode === "shadow" && summary.counts.write_side_effects !== 0) errors.push("shadow produced write side effects");
  if (mode === "canary" && summary.counts.write_side_effects !== 1) errors.push("canary did not limit writes to one synthetic node");
  if (mode === "rollback" && summary.final_state.automatic_writes !== false) errors.push("rollback did not restore read-only state");
}
const evalReport = readJson("examples/eval-results/report.json");
if (evalReport.runner?.reference_agent_integration !== "invoked_for_notready_case") errors.push("eval report does not show reference-agent integration");
validate("examples/templates/runbook.yaml", "runbook.schema.json", readYaml("examples/templates/runbook.yaml"));

const registry = readYaml("sources/registry.yaml");
const sources = registry.sources || [];
const sourceIds = sources.map((source) => source.source_id);
if (new Set(sourceIds).size !== sourceIds.length) errors.push("source registry contains duplicate source_id");
for (const source of sources) {
  for (const field of ["source_id", "title", "url", "type", "accessed_at", "review_by"]) {
    if (!source[field]) errors.push(`source ${source.source_id || "?"} missing ${field}`);
  }
  if (!["official_doc", "official_release", "public_report", "community"].includes(source.type)) {
    errors.push(`source ${source.source_id} has invalid type ${source.type}`);
  }
  if (source.snapshot) {
    const snapshotPath = path.join(root, source.snapshot.path);
    if (!fs.existsSync(snapshotPath)) errors.push(`source ${source.source_id} snapshot missing: ${source.snapshot.path}`);
    else {
      const actual = createHash("sha256").update(fs.readFileSync(snapshotPath)).digest("hex");
      if (actual !== source.snapshot.sha256) errors.push(`source ${source.source_id} snapshot hash mismatch`);
    }
  }
}
const claimRefs = new Set();
for (const file of [...walk("docs/vendors"), "docs/appendix/alibaba-agent-landscape.md"].filter((f) => f.endsWith(".md"))) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/SRC-[A-Z0-9-]+/g)) claimRefs.add(match[0]);
}
for (const ref of claimRefs) {
  if (!sourceIds.includes(ref)) errors.push(`unknown source reference ${ref}`);
}
const unused = sourceIds.filter((id) => !claimRefs.has(id));
if (unused.length) warnings.push(`unused registered sources: ${unused.join(", ")}`);

const manifest = readYaml("evals/manifest.yaml");
const partitionTotal = Object.values(manifest.partitions || {}).reduce((sum, partition) => sum + Number(partition.target_sample_size || 0), 0);
if (partitionTotal !== manifest.sample_size?.target) errors.push(`eval partition target ${partitionTotal} != suite target ${manifest.sample_size?.target}`);
if (manifest.sample_size?.release_ready && manifest.sample_size?.current < manifest.sample_size?.target) {
  errors.push("eval manifest release_ready=true before target sample size");
}
const rubricWeight = Object.values(manifest.rubric?.weights || {}).reduce((sum, value) => sum + Number(value), 0);
if (Math.abs(rubricWeight - 1) > 1e-9) errors.push(`eval rubric weights sum to ${rubricWeight}`);

for (const file of [...walk("templates"), ...walk("examples/templates")].filter((f) => f.endsWith(".yaml"))) {
  try {
    readYaml(file);
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
  }
}

const diagrams = [];
const textDiagramHits = [];
for (const file of walk("docs").filter((f) => f.endsWith(".md") && !f.includes(".vitepress"))) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1] || "";
  for (const field of ["owner", "last_verified", "review_by", "content_status"]) {
    if (!new RegExp(`^${field}:`, "m").test(frontmatter)) errors.push(`${file}: missing frontmatter ${field}`);
  }
  const reviewBy = frontmatter.match(/^review_by:\s*"?(\d{4}-\d{2}-\d{2})"?/m)?.[1];
  if (reviewBy && reviewBy < new Date().toISOString().slice(0, 10)) errors.push(`${file}: review_by expired ${reviewBy}`);
  for (const match of text.matchAll(/^::: diagram (图\s*(\d+))[^\n]*/gm)) {
    diagrams.push({ file, number: Number(match[2]), line: match[0] });
    if (!match[0].includes(" | ")) errors.push(`${file}: diagram ${match[1]} missing note`);
  }
  for (const match of text.matchAll(/```text\n([\s\S]*?)```/g)) {
    const block = match[1];
    if (/[┌└├│]/.test(block) || /第\s*[12]\s*步/.test(block) || /^\s*[^\n]+-->[^\n]+$/m.test(block)) {
      textDiagramHits.push(file);
    }
  }
}
const diagramNumbers = diagrams.map((diagram) => diagram.number);
if (new Set(diagramNumbers).size !== diagramNumbers.length) errors.push("duplicate diagram numbers");
const expected = Array.from({ length: 35 }, (_, index) => index + 1);
for (const number of expected) {
  if (!diagramNumbers.includes(number)) errors.push(`missing diagram ${number}`);
}
if (textDiagramHits.length) errors.push(`diagram-like text blocks remain: ${[...new Set(textDiagramHits)].join(", ")}`);

const roi = readJson("examples/cost/roi-example.json");
const near = (a, b, label) => {
  if (Math.abs(a - b) > 1e-6) errors.push(`${label}: ${a} != ${b}`);
};
const ui = roi.unit_inputs;
const vi = roi.value_inputs;
const model = (ui.model.input_tokens_per_event * ui.model.input_usd_per_million_tokens + ui.model.output_tokens_per_event * ui.model.output_usd_per_million_tokens) / 1_000_000;
const review = ui.human_review.review_rate * ui.human_review.minutes_per_reviewed_event / 60 * ui.human_review.loaded_usd_per_hour;
const risk = ui.risk_reserve.incident_probability_per_event * ui.risk_reserve.expected_loss_usd_per_incident;
const variable = model + ui.tool_observability_sandbox_egress_usd_per_event + review + risk;
const fixed = Object.values(ui.fixed_costs_usd_per_year).reduce((sum, value) => sum + value, 0);
const annualCost = variable * roi.volume_events_per_year + fixed;
const recovered = roi.volume_events_per_year * vi.agent.verified_resolution_rate * vi.agent.hours_avoided_per_resolved_event * vi.manual_baseline.loaded_usd_per_hour;
near(roi.derived.model_cost_usd_per_event, model, "ROI model cost");
near(roi.derived.human_review_cost_usd_per_event, review, "ROI review cost");
near(roi.derived.risk_reserve_usd_per_event, risk, "ROI risk reserve");
near(roi.derived.variable_cost_usd_per_event, variable, "ROI variable cost");
near(roi.derived.annual_agent_cost_usd, annualCost, "ROI annual cost");
near(roi.derived.annual_recovered_capacity_value_usd, recovered, "ROI recovered value");
near(roi.derived.annual_net_benefit_usd, recovered - annualCost, "ROI net benefit");
near(roi.derived.roi_fraction, (recovered - annualCost) / annualCost, "ROI fraction");

if (errors.length) {
  console.error(`Asset validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Asset validation passed: ${diagrams.length} diagrams, ${sources.length} sources, ${claimRefs.size} cited source IDs.`);
for (const warning of warnings) console.warn(`warning: ${warning}`);
