#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse, parseDocument } from "yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map();
for (const file of fs.readdirSync(path.join(ROOT, "schemas")).filter((name) => name.endsWith(".json"))) {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schemas", file), "utf8"));
  ajv.addSchema(schema, schema.$id || file);
  validators.set(file, ajv.getSchema(schema.$id || file));
}

const errors = [];
let checked = 0;
const exempt = [];
function validate(label, schemaName, data) {
  const validator = validators.get(schemaName);
  if (!validator) {
    errors.push(`${label}: missing schema ${schemaName}`);
    return;
  }
  checked += 1;
  if (!validator(data)) errors.push(`${label}: ${ajv.errorsText(validator.errors)}`);
}
function walk(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(rel) : [rel];
  });
}
function extract(file) {
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  const blocks = [];
  const re = /```(yaml|json)\n([\s\S]*?)```/g;
  let match;
  while ((match = re.exec(text))) {
    const line = text.slice(0, match.index).split("\n").length;
    try {
      const data = match[1] === "yaml" ? parse(match[2]) : JSON.parse(match[2]);
      blocks.push({ file, line, lang: match[1], data });
    } catch (error) {
      errors.push(`${file}:${line}: invalid ${match[1]}: ${error.message}`);
    }
  }
  return blocks;
}
function schemaFor(block) {
  const data = block.data;
  if (["docs/templates/tool-contract.md", "docs/guide/05-tools-permissions.md"].includes(block.file)) return "tool-contract.schema.json";
  if (block.file === "docs/templates/eval-set.md") return "eval-case.schema.json";
  if (block.file === "docs/appendix/case-notready.md" && block.lang === "yaml") return "eval-case.schema.json";
  if (block.file === "docs/guide/07-evaluation-release.md" && data?.rubric?.dimensions) return "rubric-config.schema.json";
  if (block.file === "docs/guide/07-evaluation-release.md" && data?.expected_evidence) return "eval-case.schema.json";
  if (block.file === "docs/templates/release-checklist.md") return "release.schema.json";
  if (block.file === "docs/templates/runbook-tool-map.md") return "runbook.schema.json";
  if (block.file === "docs/playbooks/incident-commander.md") return "incident.schema.json";
  if (block.file === "docs/guide/11-agentops-observability.md") return "agent-event.schema.json";
  if (block.file === "docs/guide/12-identity-security.md") return "delegation-token.schema.json";
  if (block.file === "docs/guide/06-context-knowledge.md" && block.lang === "json") return "evidence-bundle.schema.json";
  if (block.file === "docs/appendix/case-notready.md" && data?.observations) return "evidence-bundle.schema.json";
  if (block.file === "docs/appendix/case-notready.md" && data?.partial_success !== undefined) return "tool-result.schema.json";
  return null;
}

for (const file of walk("docs").filter((name) => name.endsWith(".md") && !name.includes(".vitepress"))) {
  for (const block of extract(file)) {
    const schema = schemaFor(block);
    if (schema) {
      validate(`${block.file}:${block.line}`, schema, block.data);
      if (schema === "eval-case.schema.json" && block.data.expected_evidence?.some((evidence) => evidence.snapshot_id !== block.data.snapshot_id)) errors.push(`${block.file}:${block.line}: evidence snapshot_id differs from case snapshot_id`);
    } else if (file === "docs/guide/06-context-knowledge.md" && block.lang === "yaml" && block.data?.id === "k8s-rollback-known-good" && fs.readFileSync(path.join(ROOT, file), "utf8").includes("不可独立执行")) {
      exempt.push(`${file}:${block.line}: explicitly labeled non-executable Runbook structure excerpt`);
    } else {
      errors.push(`${file}:${block.line}: structured example has no validation mapping`);
    }
  }
}

validate("templates/release.yaml", "release.schema.json", parse(fs.readFileSync(path.join(ROOT, "templates/release.yaml"), "utf8")));
validate("examples/templates/runbook.yaml", "runbook.schema.json", parse(fs.readFileSync(path.join(ROOT, "examples/templates/runbook.yaml"), "utf8")));
validate("examples/playbooks/06-incident-evidence.example.json", "incident.schema.json", JSON.parse(fs.readFileSync(path.join(ROOT, "examples/playbooks/06-incident-evidence.example.json"), "utf8")));
validate("examples/cases/notready/tool-contract.drain.json", "tool-contract.schema.json", JSON.parse(fs.readFileSync(path.join(ROOT, "examples/cases/notready/tool-contract.drain.json"), "utf8")));
const evalDocument = parseDocument(fs.readFileSync(path.join(ROOT, "examples/templates/eval-cases.yaml"), "utf8"));
const evalCases = evalDocument.toJSON();
if (Array.isArray(evalCases)) {
  for (const [index, item] of evalCases.entries()) {
    validate(`examples/templates/eval-cases.yaml[${index}]`, "eval-case.schema.json", item);
    if (item.expected_evidence?.some((evidence) => evidence.snapshot_id !== item.snapshot_id)) errors.push(`examples/templates/eval-cases.yaml[${index}]: evidence snapshot_id differs from case snapshot_id`);
  }
} else {
  errors.push("examples/templates/eval-cases.yaml must contain a top-level case array");
}

function expectInvalid(label, schemaName, data) {
  const validator = validators.get(schemaName);
  if (!validator) {
    errors.push(`${label}: missing schema ${schemaName}`);
    return;
  }
  checked += 1;
  if (validator(data)) errors.push(`${label}: negative control unexpectedly passed`);
}
function firstBlock(file, predicate) {
  return extract(file).find((block) => predicate(block.data));
}
const toolResultExample = firstBlock("docs/appendix/case-notready.md", (data) => data?.partial_success !== undefined)?.data;
if (toolResultExample) {
  const invalid = structuredClone(toolResultExample);
  invalid.partial_success = false;
  expectInvalid("negative control: failed tool result without partial_success", "tool-result.schema.json", invalid);
}
const evalExample = firstBlock("docs/templates/eval-set.md", (data) => data?.partition)?.data;
if (evalExample) {
  const invalid = structuredClone(evalExample);
  delete invalid.source_case_key;
  expectInvalid("negative control: eval case without source_case_key", "eval-case.schema.json", invalid);
}
const tokenExample = firstBlock("docs/guide/12-identity-security.md", (data) => data?.delegation)?.data;
if (tokenExample) {
  const invalid = structuredClone(tokenExample);
  invalid.delegation.non_transferable = false;
  expectInvalid("negative control: transferable delegation token", "delegation-token.schema.json", invalid);
}
const evidenceExample = firstBlock("docs/guide/06-context-knowledge.md", (data) => data?.observations)?.data;
if (evidenceExample) {
  const invalid = structuredClone(evidenceExample);
  delete invalid.observations[0].source;
  expectInvalid("negative control: evidence observation without source", "evidence-bundle.schema.json", invalid);
}
const rubricExample = firstBlock("docs/guide/07-evaluation-release.md", (data) => data?.rubric?.dimensions)?.data;
if (rubricExample) {
  const total = rubricExample.rubric.dimensions.reduce((sum, dimension) => sum + Number(dimension.weight), 0);
  if (Math.abs(total - 1) > 1e-9) errors.push(`docs/guide/07-evaluation-release.md: rubric weights sum to ${total}, not 1.0`);
}
const releaseExample = firstBlock("docs/templates/release-checklist.md", (data) => data?.bundle_version)?.data;
const releaseFile = parse(fs.readFileSync(path.join(ROOT, "templates/release.yaml"), "utf8"));
if (releaseExample && !isDeepStrictEqual(releaseExample, releaseFile)) errors.push("release-checklist Markdown example differs from templates/release.yaml");
if (releaseFile?.evidence_index) {
  const evidenceIds = releaseFile.evidence_index.map((item) => item.evidence_id);
  if (new Set(evidenceIds).size !== evidenceIds.length) errors.push("templates/release.yaml: duplicate evidence_id");
  const refs = new Set();
  const visit = (value) => {
    if (typeof value === "string" && /^EV-[A-Za-z0-9_-]+$/.test(value)) refs.add(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  visit(releaseFile);
  for (const ref of refs) if (!evidenceIds.includes(ref)) errors.push(`templates/release.yaml: unresolved evidence reference ${ref}`);
}
const runbookExample = firstBlock("docs/templates/runbook-tool-map.md", (data) => data?.steps)?.data;
const runbookFile = parse(fs.readFileSync(path.join(ROOT, "examples/templates/runbook.yaml"), "utf8"));
if (runbookExample && !isDeepStrictEqual(runbookExample, runbookFile)) errors.push("runbook-tool-map Markdown example differs from examples/templates/runbook.yaml");
const incidentExample = firstBlock("docs/playbooks/incident-commander.md", (data) => data?.incident)?.data;
const incidentFile = JSON.parse(fs.readFileSync(path.join(ROOT, "examples/playbooks/06-incident-evidence.example.json"), "utf8"));
if (incidentExample && !isDeepStrictEqual(incidentExample, incidentFile)) errors.push("incident-commander Markdown example differs from examples/playbooks/06-incident-evidence.example.json");
if (releaseExample?.evidence_mode === "synthetic") {
  const invalid = structuredClone(releaseExample);
  invalid.evaluation_result = "PASS";
  invalid.release_decision = "GO";
  expectInvalid("negative control: synthetic release marked PASS/GO", "release.schema.json", invalid);
}

if (errors.length) {
  console.error(`Embedded example validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Embedded example validation passed: ${checked} schema checks; ${exempt.length} explicitly labeled non-executable excerpt(s).`);
for (const item of exempt) console.log(`EXEMPT ${item}`);
