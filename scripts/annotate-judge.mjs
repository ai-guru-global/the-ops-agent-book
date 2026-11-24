#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const POOL_FILE = path.join(ROOT, "evidence/judge-candidates.jsonl");
const KEY_FILE = path.join(ROOT, "evidence/judge-answer-key.jsonl");
const REGISTRY_FILE = path.join(ROOT, "evidence/judge-candidate-registry.json");
const DIMENSIONS = ["diagnosis", "evidence", "safety", "action"];

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function sha256(value) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(canonical(value))).digest("hex");
}
function fileSha(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function loadJsonl(file) {
  return fs.readFileSync(file, "utf8").trim().split("\n").map((line) => JSON.parse(line));
}
function annotationDir() {
  return process.env.JUDGE_ANNOTATION_DIR || path.join(ROOT, "evidence/judge-annotations");
}
function loadPool() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
  for (const [name, entry] of Object.entries(registry.files || {})) {
    const file = path.join(ROOT, entry.path);
    if (!fs.existsSync(file) || fileSha(file) !== entry.sha256) throw new Error(`Judge pool hash mismatch: ${name}`);
  }
  const candidates = loadJsonl(POOL_FILE);
  if (candidates.length !== registry.candidate_count) throw new Error("Judge candidate count mismatch");
  return { registry, candidates };
}
function loadAnnotations(annotator = null) {
  const dir = annotationDir();
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".jsonl"));
  if (annotator) {
    const safe = annotator.replace(/[^a-zA-Z0-9_-]/g, "");
    files.splice(0, files.length, ...files.filter((file) => file === `${safe}.jsonl`));
  }
  return files.flatMap((file) => loadJsonl(path.join(dir, file)).map((item) => ({ ...item, _file: file })));
}
function validateAnnotator(annotator) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/.test(annotator || "")) throw new Error("annotator must be a pseudonymous ID of 2–64 safe characters");
  return annotator;
}
function submitAnnotation({ caseId, annotator, scores, veto, notes = "" }) {
  validateAnnotator(annotator);
  const { candidates } = loadPool();
  const candidate = candidates.find((item) => item.id === caseId);
  if (!candidate) throw new Error(`unknown Judge case: ${caseId}`);
  if (!scores || DIMENSIONS.some((dimension) => !Number.isInteger(scores[dimension]) || scores[dimension] < 0 || scores[dimension] > 2)) {
    throw new Error("scores must contain integer diagnosis/evidence/safety/action values from 0 to 2");
  }
  if (typeof veto !== "boolean") throw new Error("veto must be boolean");
  if (typeof notes !== "string" || notes.length > 2000) throw new Error("notes must be a string of at most 2000 characters");
  if (/SYNTHETIC_SECRET\s*=|BEGIN (?:RSA |EC )?PRIVATE KEY/.test(notes)) throw new Error("potential plaintext secret in annotation notes");
  const existing = loadAnnotations(annotator);
  if (existing.some((item) => item.case_id === caseId)) throw new Error(`annotator ${annotator} already annotated ${caseId}`);
  const record = {
    case_id: caseId,
    annotator,
    scores: Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, scores[dimension]])),
    veto,
    notes,
    candidate_sha256: sha256(candidate),
    annotated_at: new Date().toISOString(),
    annotation_version: "1.0.0",
    synthetic: true,
  };
  const dir = annotationDir();
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, `${annotator}.jsonl`);
  fs.appendFileSync(file, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
  return record;
}
function loadAdjudications() {
  const dir = path.join(annotationDir(), "adjudications");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".jsonl")).flatMap((file) => loadJsonl(path.join(dir, file)));
}
function submitAdjudication({ caseId, adjudicator, scores, veto, notes = "" }) {
  validateAnnotator(adjudicator);
  const { candidates } = loadPool();
  if (!candidates.some((item) => item.id === caseId)) throw new Error(`unknown Judge case: ${caseId}`);
  if (!scores || DIMENSIONS.some((dimension) => !Number.isInteger(scores[dimension]) || scores[dimension] < 0 || scores[dimension] > 2)) throw new Error("scores must contain integer 0..2 values");
  if (typeof veto !== "boolean") throw new Error("veto must be boolean");
  if (typeof notes !== "string" || notes.length > 2000 || /SYNTHETIC_SECRET\s*=|BEGIN (?:RSA |EC )?PRIVATE KEY/.test(notes)) throw new Error("invalid adjudication notes");
  const annotations = loadAnnotations().filter((item) => item.case_id === caseId);
  if (new Set(annotations.map((item) => item.annotator)).size < 2) throw new Error("adjudication requires two independent annotations");
  if (annotations.some((item) => item.annotator === adjudicator)) throw new Error("adjudicator must be independent of both annotators");
  if (loadAdjudications().some((item) => item.case_id === caseId)) throw new Error(`case already adjudicated: ${caseId}`);
  const record = {
    case_id: caseId,
    adjudicator,
    scores: Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, scores[dimension]])),
    veto,
    notes,
    annotation_version: "1.0.0",
    adjudicated_at: new Date().toISOString(),
    synthetic: true,
  };
  const dir = path.join(annotationDir(), "adjudications");
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.appendFileSync(path.join(dir, `${adjudicator}.jsonl`), `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
  return record;
}
function nextForAnnotator(annotator) {
  validateAnnotator(annotator);
  const { candidates } = loadPool();
  const done = new Set(loadAnnotations(annotator).map((item) => item.case_id));
  const candidate = candidates.find((item) => !done.has(item.id));
  if (!candidate) return null;
  return {
    id: candidate.id,
    scenario: candidate.scenario,
    category: candidate.category,
    input: candidate.input,
    context: candidate.context,
    evidence: candidate.evidence,
    candidate_answer: candidate.candidate_answer,
    synthetic: true,
  };
}
function status() {
  const { registry, candidates } = loadPool();
  const annotations = loadAnnotations();
  const byCase = new Map();
  for (const annotation of annotations) {
    if (!byCase.has(annotation.case_id)) byCase.set(annotation.case_id, new Set());
    byCase.get(annotation.case_id).add(annotation.annotator);
  }
  const doubleAnnotated = [...byCase.values()].filter((annotators) => annotators.size >= 2).length;
  const adjudicatedCases = new Set(loadAdjudications().map((item) => item.case_id)).size;
  return {
    candidate_count: registry.candidate_count,
    annotated_cases: byCase.size,
    double_annotated_cases: doubleAnnotated,
    adjudicated_cases: adjudicatedCases,
    remaining_cases: registry.candidate_count - byCase.size,
    annotation_records: annotations.length,
    release_ready: false,
    note: "Candidate pool is ready; no human annotation or adjudication is claimed by generation.",
  };
}
function kappa(pairs) {
  if (!pairs.length) return null;
  const labels = [0, 1, 2];
  const n = pairs.length;
  let observed = 0;
  for (const [a, b] of pairs) if (a === b) observed += 1;
  observed /= n;
  let expected = 0;
  for (const label of labels) {
    const a = pairs.filter(([x]) => x === label).length / n;
    const b = pairs.filter(([, y]) => y === label).length / n;
    expected += a * b;
  }
  return expected === 1 ? 1 : (observed - expected) / (1 - expected);
}
function report() {
  const { candidates } = loadPool();
  const annotations = loadAnnotations();
  const keys = new Map(loadJsonl(KEY_FILE).map((item) => [item.case_id, item]));
  const byCase = new Map();
  for (const annotation of annotations) {
    if (!byCase.has(annotation.case_id)) byCase.set(annotation.case_id, []);
    byCase.get(annotation.case_id).push(annotation);
  }
  const dimensionPairs = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, []]));
  const overallPairs = [];
  const vetoPairs = [];
  for (const records of byCase.values()) {
    if (records.length < 2) continue;
    const [a, b] = records;
    const same = DIMENSIONS.every((dimension) => a.scores[dimension] === b.scores[dimension]);
    overallPairs.push([1, same ? 1 : 0]);
    vetoPairs.push([a.veto, b.veto]);
    for (const dimension of DIMENSIONS) dimensionPairs[dimension].push([a.scores[dimension], b.scores[dimension]]);
  }
  const perAnnotator = {};
  for (const annotation of annotations) {
    const key = keys.get(annotation.case_id);
    if (!key) continue;
    const item = perAnnotator[annotation.annotator] ||= { records: 0, rubric_exact: 0, veto_true: 0, veto_detected: 0, evidence_defect_true: 0, evidence_defect_detected: 0 };
    item.records += 1;
    if (DIMENSIONS.every((dimension) => annotation.scores[dimension] === key.rubric[dimension])) item.rubric_exact += 1;
    if (key.veto_expected) {
      item.veto_true += 1;
      if (annotation.veto) item.veto_detected += 1;
    }
    if (key.rubric.evidence < 2) {
      item.evidence_defect_true += 1;
      if (annotation.scores.evidence < 2) item.evidence_defect_detected += 1;
    }
  }
  for (const item of Object.values(perAnnotator)) {
    item.rubric_exact_rate = item.records ? item.rubric_exact / item.records : null;
    item.safety_recall = item.veto_true ? item.veto_detected / item.veto_true : null;
    item.evidence_recall = item.evidence_defect_true ? item.evidence_defect_detected / item.evidence_defect_true : null;
  }
  const agreement = overallPairs.length ? overallPairs.filter(([a, b]) => a === b).length / overallPairs.length : null;
  return {
    candidate_count: candidates.length,
    annotation_records: annotations.length,
    double_annotated_cases: overallPairs.length,
    adjudicated_cases: loadAdjudications().length,
    agreement,
    dimension_agreement: Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, dimensionPairs[dimension].length ? dimensionPairs[dimension].filter(([a, b]) => a === b).length / dimensionPairs[dimension].length : null])),
    cohens_kappa: Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, kappa(dimensionPairs[dimension])])),
    veto_agreement: vetoPairs.length ? vetoPairs.filter(([a, b]) => a === b).length / vetoPairs.length : null,
    per_annotator: perAnnotator,
    thresholds: { agreement: 0.9, cohens_kappa: 0.8, safety_recall: 0.98, evidence_recall: 0.98 },
    release_ready: false,
    note: "Report is descriptive until 300 cases have two independent annotators, adjudication and signed release approval.",
  };
}

function usage() {
  console.log("Usage:\n  node scripts/annotate-judge.mjs status\n  node scripts/annotate-judge.mjs next --annotator <pseudonymous-id>\n  node scripts/annotate-judge.mjs submit --case <id> --annotator <id> --diagnosis <0..2> --evidence <0..2> --safety <0..2> --action <0..2> --veto <true|false> [--notes <text>]\n  node scripts/annotate-judge.mjs adjudicate --case <id> --adjudicator <independent-id> --diagnosis <0..2> --evidence <0..2> --safety <0..2> --action <0..2> --veto <true|false> [--notes <text>]\n  node scripts/annotate-judge.mjs report");
}
function main(argv) {
  const [command, ...args] = argv;
  const get = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : null;
  };
  if (command === "status") return console.log(JSON.stringify(status(), null, 2));
  if (command === "next") return console.log(JSON.stringify(nextForAnnotator(get("--annotator")), null, 2));
  if (command === "report") return console.log(JSON.stringify(report(), null, 2));
  if (command === "adjudicate") {
    const record = submitAdjudication({
      caseId: get("--case"),
      adjudicator: get("--adjudicator"),
      scores: { diagnosis: Number(get("--diagnosis")), evidence: Number(get("--evidence")), safety: Number(get("--safety")), action: Number(get("--action")) },
      veto: get("--veto") === "true" ? true : get("--veto") === "false" ? false : null,
      notes: get("--notes") || "",
    });
    return console.log(JSON.stringify(record, null, 2));
  }
  if (command === "submit") {
    const record = submitAnnotation({
      caseId: get("--case"),
      annotator: get("--annotator"),
      scores: { diagnosis: Number(get("--diagnosis")), evidence: Number(get("--evidence")), safety: Number(get("--safety")), action: Number(get("--action")) },
      veto: get("--veto") === "true" ? true : get("--veto") === "false" ? false : null,
      notes: get("--notes") || "",
    });
    return console.log(JSON.stringify(record, null, 2));
  }
  usage();
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

export { loadPool, submitAnnotation, submitAdjudication, nextForAnnotator, status, report, kappa };
