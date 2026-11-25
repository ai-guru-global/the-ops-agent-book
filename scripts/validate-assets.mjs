#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";
import { loadInputs, validateCases, validateManifest } from "./run-evals.mjs";
import { loadPool, status as judgeStatus } from "./annotate-judge.mjs";
import { generateGateRegistry } from "./generate-gate-registry.mjs";
import { generateReferences } from "./generate-references.mjs";

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

function extractFencedYaml(text, file) {
  const blocks = [];
  let current = null;
  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!current) {
      if (/^\s*```ya?ml\s*$/i.test(line)) current = { line: index + 2, lines: [] };
    } else if (/^\s*```\s*$/.test(line)) {
      blocks.push({ file, line: current.line, source: current.lines.join("\n") });
      current = null;
    } else {
      current.lines.push(line);
    }
  }
  if (current) errors.push(`${file}:${current.line}: unclosed YAML fence`);
  return blocks;
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
const evalManifest = readYaml("evals/manifest.yaml");
try {
  generateGateRegistry({ check: true });
} catch (error) {
  errors.push(`gate registry: ${error.message}`);
}
const gateProfiles = evalManifest.gate_profiles;
if (!gateProfiles || gateProfiles.registry_version !== "gate-registry-1.0.0") errors.push("gate profile registry version is missing or invalid");
if (gateProfiles?.G3?.metrics_ref !== "metrics") errors.push("G3 must reference the canonical metrics block");
if (gateProfiles?.G3?.independent_judge_cases !== 300) errors.push("G3 independent Judge sample must be 300");
if (gateProfiles?.G5?.human_takeover_rate_max !== 0.1) errors.push("G5 production takeover gate must remain stricter than G3/G4");
if (gateProfiles?.G4?.unsafe_action_rate_max !== 0 || gateProfiles?.G5?.unsafe_action_rate_max !== 0 || gateProfiles?.G6?.unsafe_action_rate_max !== 0) errors.push("G4-G6 unsafe action gates must be zero");
const judgeCalibration = readYaml(evalManifest.judge_calibration?.source || "evals/judge-calibration.yaml");
if (evalManifest.judge_calibration?.independent_of_eval_suite !== true) errors.push("Judge calibration must be independent of the evaluation suite");
if (judgeCalibration.sample_size?.target !== 300 || judgeCalibration.sample_size?.release_ready !== false) errors.push("Judge calibration starter must explicitly be 0/300 and not release-ready");
if (judgeCalibration.sample_size?.current !== 0) errors.push("Judge calibration starter must not claim completed cases");
const judgePool = loadPool();
const judgeCurrent = judgeStatus();
if (judgePool.registry.candidate_count !== 300 || judgePool.candidates.length !== 300) errors.push("Judge candidate pool must contain exactly 300 cases");
if (judgePool.registry.annotated_count !== 0 || judgePool.registry.release_ready !== false) errors.push("Judge candidate registry must not claim human annotations or release readiness");
if (judgeCalibration.sample_size?.candidate_count !== 300) errors.push("Judge calibration manifest candidate_count must be 300");
if (judgeCurrent.candidate_count !== 300 || judgeCurrent.release_ready !== false) errors.push("Judge annotation tool status is inconsistent");
const judgeSnapshotRegistry = readJson("evidence/judge-snapshot-registry.json");
const judgeSnapshotLines = fs.readFileSync(path.join(root, "evidence/judge-snapshots.jsonl"), "utf8").trim().split("\n");
if (judgeSnapshotRegistry.snapshots?.length !== 300 || judgeSnapshotLines.length !== 300) errors.push("Judge snapshot registry must contain 300 fixtures");
for (const entry of judgeSnapshotRegistry.snapshots || []) {
  const line = judgeSnapshotLines[entry.line_number - 1];
  if (!line || createHash("sha256").update(line).digest("hex") !== entry.sha256) errors.push(`Judge snapshot hash mismatch: ${entry.snapshot_id}`);
}
const judgeKeyLines = fs.readFileSync(path.join(root, "evidence/judge-answer-key.jsonl"), "utf8").trim().split("\n").map((line) => JSON.parse(line));
if (judgeKeyLines.length !== 300 || judgeKeyLines.some((key) => !judgePool.candidates.some((candidate) => candidate.id === key.case_id))) errors.push("Judge answer key must cover exactly the candidate pool");
const evalReport = readJson("examples/eval-results/report.json");
if (evalReport.runner?.reference_agent_integration !== "invoked_for_notready_case") errors.push("eval report does not show reference-agent integration");
if (evalReport.judge_calibration?.sample_size !== 300 || evalReport.judge_calibration?.release_ready !== false) errors.push("eval report does not expose incomplete independent Judge calibration");
if (process.env.SKIP_POC_VALIDATION !== "1") {
const pocReport = readJson("examples/poc/reference-agent-poc.json");
if (pocReport.synthetic !== true || pocReport.production_ready !== false) errors.push("POC report must be explicitly synthetic and non-production");
if (!["PASS", "FAIL", "INCONCLUSIVE"].includes(pocReport.final_decision)) errors.push("POC report has invalid final decision");
if (pocReport.clean_room?.import_pass !== true || pocReport.clean_room?.temp_removed !== true) errors.push("POC clean-room import or temporary cleanup did not pass");
const pocScore = (pocReport.scores || []).reduce((sum, item) => sum + Number(item.score || 0) / 5 * Number(item.weight || 0) * 100, 0);
if (Math.abs(pocScore - Number(pocReport.weighted_score)) > 0.01) errors.push("POC weighted score does not match dimension scores");
for (const artifact of pocReport.artifacts || []) {
  const artifactPath = path.join(root, artifact.path);
  if (!fs.existsSync(artifactPath)) errors.push(`POC artifact missing: ${artifact.path}`);
  else if (createHash("sha256").update(fs.readFileSync(artifactPath)).digest("hex") !== artifact.sha256) errors.push(`POC artifact hash stale: ${artifact.path}`);
}
const pocMarkdown = fs.readFileSync(path.join(root, "examples/poc/reference-agent-poc.md"), "utf8");
if (!pocMarkdown.includes(`**${pocReport.final_decision}**`) || !pocMarkdown.includes(`${pocReport.weighted_score.toFixed(1)} / 100`)) errors.push("POC Markdown summary differs from JSON report");
}
validate("examples/templates/runbook.yaml", "runbook.schema.json", readYaml("examples/templates/runbook.yaml"));

const toolContractFile = "docs/templates/tool-contract.md";
const toolContractBlocks = extractFencedYaml(fs.readFileSync(path.join(root, toolContractFile), "utf8"), toolContractFile);
const toolContractExamples = [];
if (toolContractBlocks.length === 0) errors.push(`${toolContractFile}: no fenced YAML contracts found`);
for (const [index, block] of toolContractBlocks.entries()) {
  const label = `${block.file}:${block.line} (fenced YAML ${index + 1})`;
  try {
    const data = parse(block.source);
    toolContractExamples.push(data);
    validate(label, "tool-contract.schema.json", data);
  } catch (error) {
    errors.push(`${label}: invalid YAML: ${error.message}`);
  }
}

const toolContractValidator = validators.get("tool-contract.schema.json");
let negativeControlCount = 0;
function expectInvalidContract(label, data, expected) {
  negativeControlCount += 1;
  if (toolContractValidator(data)) {
    errors.push(`${toolContractFile}: negative control unexpectedly passed: ${label}`);
    return;
  }
  const intendedFailure = toolContractValidator.errors?.some((error) =>
    error.instancePath === expected.instancePath
    && error.keyword === expected.keyword
    && (expected.missingProperty === undefined || error.params?.missingProperty === expected.missingProperty));
  if (!intendedFailure) {
    errors.push(`${toolContractFile}: negative control failed for the wrong reason: ${label}: ${ajv.errorsText(toolContractValidator.errors)}`);
  }
}
if (toolContractExamples.length > 0 && toolContractValidator) {
  const reversibleWithoutRollback = structuredClone(toolContractExamples[0]);
  reversibleWithoutRollback.reversible = true;
  reversibleWithoutRollback.rollback = null;
  expectInvalidContract("reversible:true with rollback:null", reversibleWithoutRollback, {
    instancePath: "/rollback", keyword: "type"
  });

  for (const field of ["security", "observability"]) {
    const missingField = structuredClone(toolContractExamples[0]);
    delete missingField[field];
    expectInvalidContract(`missing required ${field}`, missingField, {
      instancePath: "", keyword: "required", missingProperty: field
    });
  }
  for (const field of ["credentials", "secret_handling", "input_validation", "injection_protection"]) {
    const missingField = structuredClone(toolContractExamples[0]);
    delete missingField.security[field];
    expectInvalidContract(`missing required security.${field}`, missingField, {
      instancePath: "/security", keyword: "required", missingProperty: field
    });
  }
}

const releaseTemplate = readYaml("templates/release.yaml");
if (releaseTemplate.evaluation_result !== "INCONCLUSIVE" || releaseTemplate.release_decision !== "NO_GO") {
  errors.push("templates/release.yaml must remain fail-closed: INCONCLUSIVE / NO_GO");
}
if (!Array.isArray(releaseTemplate.signoffs) || releaseTemplate.signoffs.length !== 0) {
  errors.push("templates/release.yaml synthetic example must not contain signoffs");
}
const releaseDocFile = "docs/templates/release-checklist.md";
const releaseDocBlocks = extractFencedYaml(fs.readFileSync(path.join(root, releaseDocFile), "utf8"), releaseDocFile)
  .map((block) => {
    try { return parse(block.source); } catch { return null; }
  })
  .filter((value) => value?.artifact_id === releaseTemplate.artifact_id);
if (releaseDocBlocks.length !== 1) errors.push(`${releaseDocFile}: expected exactly one machine-readable synthetic release example`);
if (releaseDocBlocks[0] && !isDeepStrictEqual(releaseDocBlocks[0], releaseTemplate)) {
  errors.push(`${releaseDocFile}: synthetic release example differs from templates/release.yaml`);
}
const incidentTemplate = readYaml("templates/incident-review.yaml");
if (incidentTemplate.related_release?.id !== releaseTemplate.lkg?.artifact_id) {
  errors.push("templates/incident-review.yaml related_release does not match the synthetic LKG");
}

const actionAssertionTypes = new Set([
  "required_tool", "forbidden_tool", "required_approval", "required_precondition",
  "required_recommendation", "max_blast_radius",
]);
function validateActionAssertions(file, example) {
  if (!Array.isArray(example.expected_action_assertions) || example.expected_action_assertions.length === 0) {
    errors.push(`${file}: ${example.id || "eval case"} missing expected_action_assertions`);
    return;
  }
  for (const assertion of example.expected_action_assertions) {
    if (!actionAssertionTypes.has(assertion?.type)) errors.push(`${file}: unsupported action assertion type ${assertion?.type}`);
    if (["required_tool", "forbidden_tool", "required_approval"].includes(assertion?.type) && typeof assertion.tool !== "string") {
      errors.push(`${file}: action assertion ${assertion?.type} missing tool`);
    }
    if (assertion?.type === "required_approval" && (!Number.isInteger(assertion.min_approvers) || assertion.min_approvers < 1)) {
      errors.push(`${file}: required_approval missing positive min_approvers`);
    }
    if (assertion?.type === "required_precondition" && typeof assertion.check !== "string") {
      errors.push(`${file}: required_precondition missing check`);
    }
    if (assertion?.type === "required_recommendation" && typeof assertion.field !== "string") {
      errors.push(`${file}: required_recommendation missing field`);
    }
    if (assertion?.type === "max_blast_radius" && (!Number.isInteger(assertion.value) || assertion.value < 0)) {
      errors.push(`${file}: max_blast_radius missing non-negative integer value`);
    }
  }
}

const caseFile = "docs/appendix/case-notready.md";
const caseBlocks = extractFencedYaml(fs.readFileSync(path.join(root, caseFile), "utf8"), caseFile)
  .map((block) => {
    try { return parse(block.source); } catch { return null; }
  })
  .filter((value) => value?.id === "synthetic-k8s-node-notready-001");
if (caseBlocks.length !== 1) errors.push(`${caseFile}: expected exactly one complete synthetic eval case`);
if (caseBlocks[0]) {
  const example = caseBlocks[0];
  for (const field of ["source_case_key", "scenario", "category", "partition", "environment", "severity", "input", "expected_action", "snapshot_id"]) {
    if (typeof example[field] !== "string" || !example[field]) errors.push(`${caseFile}: eval case missing ${field}`);
  }
  if (!Array.isArray(example.forbidden_actions)) errors.push(`${caseFile}: forbidden_actions must be an array`);
  validateActionAssertions(caseFile, example);
  if (!Array.isArray(example.expected_evidence) || example.expected_evidence.length === 0) errors.push(`${caseFile}: expected_evidence must be non-empty`);
  for (const evidence of example.expected_evidence || []) {
    for (const field of ["source", "contains", "snapshot_id", "time", "raw_ref"]) {
      if (typeof evidence?.[field] !== "string" || !evidence[field]) errors.push(`${caseFile}: expected_evidence missing ${field}`);
    }
    if (evidence?.snapshot_id !== example.snapshot_id) errors.push(`${caseFile}: evidence snapshot_id differs from case snapshot_id`);
    if (evidence?.raw_ref && !/^s3:\/\/.+\?versionId=.+/.test(evidence.raw_ref)) errors.push(`${caseFile}: raw_ref must be versioned s3://`);
  }
  const eventSchema = readJson("schemas/agent-event.schema.json");
  const runPayloadValidator = ajv.compile(eventSchema.$defs.runCompleted);
  const verificationPayloadValidator = ajv.compile(eventSchema.$defs.verificationCompleted);
  if (!runPayloadValidator(example.expected_run_completed)) errors.push(`${caseFile}: expected_run_completed failed agent-event schema: ${ajv.errorsText(runPayloadValidator.errors)}`);
  if (!verificationPayloadValidator(example.expected_verification_completed)) errors.push(`${caseFile}: expected_verification_completed failed agent-event schema: ${ajv.errorsText(verificationPayloadValidator.errors)}`);
  if (!["succeeded", "failed"].includes(example.expected_tool_result?.status)) errors.push(`${caseFile}: expected_tool_result.status is invalid`);
  if (example.expected_tool_result?.partial_success !== true || !Array.isArray(example.expected_tool_result?.step_statuses)) errors.push(`${caseFile}: partial-success tool result is incomplete`);
}

const evalDocFile = "docs/templates/eval-set.md";
const evalDocCases = extractFencedYaml(fs.readFileSync(path.join(root, evalDocFile), "utf8"), evalDocFile)
  .map((block) => {
    try { return parse(block.source); } catch { return null; }
  })
  .filter((value) => ["k8s-crashloop-001", "k8s-node-notready-001"].includes(value?.id));
if (evalDocCases.length !== 2) errors.push(`${evalDocFile}: expected two documented eval cases`);
for (const example of evalDocCases) validateActionAssertions(evalDocFile, example);

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
try {
  generateReferences({ check: true });
} catch (error) {
  errors.push(`references: ${error.message}`);
}
const claimRefs = new Set();
for (const file of [...walk("docs/vendors"), "docs/appendix/alibaba-agent-landscape.md"].filter((f) => f.endsWith(".md"))) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/SRC-[A-Z0-9-]+/g)) claimRefs.add(match[0]);
}
for (const ref of claimRefs) {
  if (!sourceIds.includes(ref)) errors.push(`unknown source reference ${ref}`);
}
const sourceById = new Map(sources.map((source) => [source.source_id, source]));
const vendorFiles = [...walk("docs/vendors"), "docs/appendix/alibaba-agent-landscape.md"].filter((file) => file.endsWith(".md"));
const claimPattern = /\b(?:(?:GC|CN)-[A-Z]{1,4}-\d{2}|(?:OBS|SEC|FIN|VERT|ALI|NET)-\d{2}|EMB-[A-Z]{1,4}-\d{2})\b/g;
for (const file of vendorFiles) {
  const productSection = fs.readFileSync(path.join(root, file), "utf8").split("## 商业字段证据卡")[0];
  for (const line of productSection.split("\n")) {
    if (!line.startsWith("|")) continue;
    const claimIds = [...line.matchAll(claimPattern)].map((match) => match[0]);
    const sourceRefs = [...line.matchAll(/SRC-[A-Z0-9-]+/g)].map((match) => match[0]);
    if (claimIds.length === 1 && sourceRefs.length === 1) {
      const [claimId] = claimIds;
      const [sourceId] = sourceRefs;
      if (!sourceById.get(sourceId)?.claims?.includes(claimId)) errors.push(`${file}: ${claimId} cites ${sourceId} but source registry claim mapping is missing`);
    }
  }
}
const unused = sourceIds.filter((id) => !claimRefs.has(id));
if (unused.length) warnings.push(`registered sources not cited in vendor capability tables (reference-only/navigation allowed): ${unused.join(", ")}`);

const gapRegistry = readJson("sources/claim-gaps.json");
const gapClaims = gapRegistry.claims || [];
const gapIds = gapClaims.map((claim) => claim.claim_id);
if (new Set(gapIds).size !== gapIds.length) errors.push("claim gap registry contains duplicate claim_id");
const gapsWithSources = gapClaims.filter((claim) => (claim.source_ids || []).length > 0).length;
if (gapRegistry.summary?.total_claims !== gapClaims.length || gapRegistry.summary?.with_sources !== gapsWithSources || gapRegistry.summary?.without_sources !== gapClaims.length - gapsWithSources) {
  errors.push("claim gap registry summary totals are stale");
}
const vendorText = vendorFiles.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
const explicitGapIds = new Set();
for (const file of vendorFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const line of text.split("\n")) {
    if (!line.startsWith("|") || !line.includes("未核实")) continue;
    for (const match of line.matchAll(claimPattern)) explicitGapIds.add(match[0]);
  }
}
for (const claimId of explicitGapIds) {
  if (!gapIds.includes(claimId)) errors.push(`explicit unverified claim ${claimId} missing from sources/claim-gaps.json`);
}
for (const claim of gapClaims) {
  if (!claimPattern.test(vendorText)) errors.push(`gap claim ${claim.claim_id} is not referenced by vendor pages`);
  claimPattern.lastIndex = 0;
  if (!["needs_evidence", "partially_verified", "closed"].includes(claim.status)) errors.push(`gap claim ${claim.claim_id} has invalid status`);
  const expectedSources = sources.filter((source) => source.claims?.includes(claim.claim_id)).map((source) => source.source_id).sort();
  const actualSources = [...(claim.source_ids || [])].sort();
  if (JSON.stringify(expectedSources) !== JSON.stringify(actualSources)) errors.push(`gap claim ${claim.claim_id} source_ids differ from source registry`);
  for (const sourceId of actualSources) {
    if (!sourceIds.includes(sourceId)) errors.push(`gap claim ${claim.claim_id} references unknown source ${sourceId}`);
  }
}

const manifest = readYaml("evals/manifest.yaml");
const partitionTotal = Object.values(manifest.partitions || {}).reduce((sum, partition) => sum + Number(partition.target_sample_size || 0), 0);
if (partitionTotal !== manifest.sample_size?.target) errors.push(`eval partition target ${partitionTotal} != suite target ${manifest.sample_size?.target}`);
if (manifest.sample_size?.release_ready && manifest.sample_size?.current < manifest.sample_size?.target) {
  errors.push("eval manifest release_ready=true before target sample size");
}
const rubricWeight = Object.values(manifest.rubric?.weights || {}).reduce((sum, value) => sum + Number(value), 0);
if (Math.abs(rubricWeight - 1) > 1e-9) errors.push(`eval rubric weights sum to ${rubricWeight}`);
const evalInputs = loadInputs();
errors.push(...validateManifest(evalInputs.manifest), ...validateCases(evalInputs.manifest, evalInputs.cases).errors);
if (evalInputs.cases.length !== manifest.sample_size?.current) errors.push(`eval case count ${evalInputs.cases.length} != manifest current ${manifest.sample_size?.current}`);

for (const file of [...walk("templates"), ...walk("examples/templates")].filter((f) => f.endsWith(".yaml"))) {
  try {
    readYaml(file);
  } catch (error) {
    errors.push(`${file}: ${error.message}`);
  }
}

const diagrams = [];
const textDiagramHits = [];
const contentDocs = walk("docs").filter((f) => f.endsWith(".md") && !f.includes(".vitepress"));
for (const file of contentDocs) {
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
const thresholdRules = [
  { label: "Top-3 根因命中", pattern: /Top-3\s*≥\s*(\d+(?:\.\d+)?)%/g, minimum: Number(manifest.metrics.root_cause_top3_min) * 100 },
  { label: "证据引用准确率", pattern: /证据引用准确率\s*≥\s*(\d+(?:\.\d+)?)%/g, minimum: Number(manifest.metrics.evidence_reference_accuracy_min) * 100 },
  { label: "诊断命中率", pattern: /诊断命中率\s*≥\s*(\d+(?:\.\d+)?)%/g, minimum: Number(manifest.metrics.root_cause_top3_min) * 100 },
];
for (const file of contentDocs) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const rule of thresholdRules) {
    for (const match of text.matchAll(rule.pattern)) {
      if (Number(match[1]) + 1e-9 < rule.minimum) {
        errors.push(`${file}: ${rule.label} threshold ${match[1]}% is weaker than gate_profiles.G3 ${rule.minimum}%`);
      }
    }
  }
  for (const [metricId, minimum] of [
    ["top3_root_cause_hit", Number(manifest.metrics.root_cause_top3_min)],
    ["evidence_citation_accuracy", Number(manifest.metrics.evidence_reference_accuracy_min)],
  ]) {
    const pattern = new RegExp("`" + metricId + "`[^\\n]*≥\\s*(\\d+\\.\\d+)", "g");
    for (const match of text.matchAll(pattern)) {
      if (Number(match[1]) + 1e-9 < minimum) {
        errors.push(`${file}: ${metricId} target ${match[1]} is weaker than gate_profiles.G3 ${minimum}`);
      }
    }
  }
}
const maintenanceFile = "docs/appendix/maintenance-registry.md";
const maintenanceText = fs.readFileSync(path.join(root, maintenanceFile), "utf8");
const maintainedDocs = new Set(
  [...maintenanceText.matchAll(/\]\((\.\.?\/[^)]+\.md)\)/g)]
    .map((match) => path.normalize(path.join(path.dirname(maintenanceFile), match[1])))
);
for (const file of contentDocs) {
  if (!maintainedDocs.has(file)) errors.push(`maintenance registry missing ${file}`);
}
for (const file of maintainedDocs) {
  if (!contentDocs.includes(file)) errors.push(`maintenance registry references missing ${file}`);
}
const diagramNumbers = diagrams.map((diagram) => diagram.number);
if (new Set(diagramNumbers).size !== diagramNumbers.length) errors.push("duplicate diagram numbers");
const expected = Array.from({ length: 50 }, (_, index) => index + 1);
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
console.log(`Asset validation passed: ${diagrams.length} diagrams, ${sources.length} sources, ${claimRefs.size} cited source IDs, ${gapClaims.length} tracked evidence gaps, ${evalInputs.cases.length} eval cases, ${toolContractExamples.length} tool-contract YAML examples, ${negativeControlCount} negative controls.`);
for (const warning of warnings) console.warn(`warning: ${warning}`);
