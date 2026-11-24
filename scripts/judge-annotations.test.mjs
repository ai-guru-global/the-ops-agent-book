import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPool, submitAnnotation, submitAdjudication, nextForAnnotator, status, report } from "./annotate-judge.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

test("Judge candidate pool is 300, disjoint, and not release-ready", () => {
  const { registry, candidates } = loadPool();
  assert.equal(registry.candidate_count, 300);
  assert.equal(registry.annotated_count, 0);
  assert.equal(registry.release_ready, false);
  assert.equal(registry.disjoint_from_eval_suite, true);
  assert.equal(candidates.length, 300);
  assert.equal(new Set(candidates.map((item) => item.id)).size, 300);
  assert.equal(new Set(candidates.map((item) => item.snapshot_id)).size, 300);
});

test("two independent annotations produce agreement and kappa without claiming release", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "judge-annotation-test-"));
  const previous = process.env.JUDGE_ANNOTATION_DIR;
  process.env.JUDGE_ANNOTATION_DIR = temp;
  try {
    const candidate = nextForAnnotator("annotator-a");
    assert.ok(candidate);
    const key = fs.readFileSync(path.join(ROOT, "evidence/judge-answer-key.jsonl"), "utf8")
      .trim().split("\n").map((line) => JSON.parse(line)).find((item) => item.case_id === candidate.id);
    submitAnnotation({ caseId: candidate.id, annotator: "annotator-a", scores: key.rubric, veto: key.veto_expected, notes: "synthetic test" });
    submitAnnotation({ caseId: candidate.id, annotator: "annotator-b", scores: key.rubric, veto: key.veto_expected, notes: "synthetic test" });
    const current = status();
    assert.equal(current.annotated_cases, 1);
    assert.equal(current.double_annotated_cases, 1);
    assert.equal(current.adjudicated_cases, 0);
    assert.equal(current.release_ready, false);
    submitAdjudication({ caseId: candidate.id, adjudicator: "adjudicator-c", scores: key.rubric, veto: key.veto_expected, notes: "synthetic adjudication" });
    assert.equal(status().adjudicated_cases, 1);
    const result = report();
    assert.equal(result.agreement, 1);
    assert.equal(result.cohens_kappa.diagnosis, 1);
    assert.equal(result.adjudicated_cases, 1);
    assert.equal(result.release_ready, false);
    assert.throws(() => submitAnnotation({ caseId: candidate.id, annotator: "annotator-a", scores: key.rubric, veto: key.veto_expected }), /already annotated/);
    assert.throws(() => submitAnnotation({ caseId: candidate.id, annotator: "annotator-c", scores: { ...key.rubric, diagnosis: 3 }, veto: false }), /0 to 2/);
  } finally {
    if (previous === undefined) delete process.env.JUDGE_ANNOTATION_DIR;
    else process.env.JUDGE_ANNOTATION_DIR = previous;
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
