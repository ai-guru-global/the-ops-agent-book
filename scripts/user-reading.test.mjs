import fs from "node:fs";
import YAML from "yaml";
import test from "node:test";
import assert from "node:assert/strict";
import { summarize, validateRecords } from "./validate-user-reading.mjs";

function record(id, role = "sre") {
  const capabilities = { sre: ["k8s"], platform: ["observability"], ai: ["ai"], docs: ["documentation"] };
  return {
    schema_version: "1.1",
    participant_id: id,
    role,
    capabilities: capabilities[role],
    years_experience: 5,
    agent_project_experience: true,
    consent: true,
    environment: {
      desktop_browser: "Chrome 130",
      desktop_viewport: "1440x900",
      mobile_device: "Pixel 8 emulation",
      mobile_viewport: "390x844",
      print: { checked: true, pages: ["guide/05-tools-permissions", "playbooks/k8s"], renderer: "Chrome print to PDF" },
      site_commit_sha: "a".repeat(40),
      tested_at: "2026-11-25T10:00:00.000Z"
    },
    session: {
      session_id: `USR-${id}`,
      facilitator_id: "FACILITATOR-01",
      consent_recorded: true,
      recording_ref: `evidence://user-reading/${id}/session`
    },
    tasks: ["T1", "T2", "T3", "T4"].map((taskId) => ({
      id: taskId,
      success: true,
      first_correct_seconds: taskId === "T3" ? 590 : 110,
      time_seconds: taskId === "T3" ? 600 : 120,
      timed_out: false,
      wrong_turns: 0,
      help_used: false,
      safety_misunderstanding: false,
      ...(taskId === "T3" ? { artifacts: {
        tool_contract_ref: `evidence://user-reading/${id}/tool-contract.yaml`,
        eval_case_ref: `evidence://user-reading/${id}/eval-case.yaml`,
        permission_rule_ref: `evidence://user-reading/${id}/permission-matrix.yaml#rule-1`,
        non_goals_ref: `evidence://user-reading/${id}/design.md#non-goals`,
        verification_ref: `evidence://user-reading/${id}/design.md#verification`,
        rollback_ref: `evidence://user-reading/${id}/design.md#rollback`
      } } : {}),
      ...(taskId === "T4" ? {
        diagram_clarity: 4,
        mobile_result: { passed: true, evidence_ref: `evidence://user-reading/${id}/mobile.png` },
        print_result: { passed: true, evidence_ref: `evidence://user-reading/${id}/print.pdf` }
      } : {})
    })),
    issues: [],
    feedback: { most_confusing: [], most_useful: [] },
    evidence_review: {
      reviewer_id: "REVIEWER-01",
      reviewed_at: "2026-11-25T11:00:00.000Z",
      decision: "accepted",
      anonymization_confirmed: true,
      evidence_ref: `evidence://user-reading/${id}/review`
    }
  };
}

function threeRecords() {
  return [record("TEST-P01"), record("TEST-P02", "platform"), record("TEST-P03", "ai")];
}

test("protocol YAML example stays schema-valid and independently reviewable", () => {
  const protocol = fs.readFileSync(new URL("../reports/validation/user-reading-protocol.md", import.meta.url), "utf8");
  const match = protocol.match(/```yaml\n([\s\S]*?)```/);
  assert.ok(match, "protocol YAML example is missing");
  const example = YAML.parse(match[1]);
  assert.equal(example.participant_id, "EXAMPLE-P01");
  assert.deepEqual(validateRecords([example]), []);
});

test("no records remains not_executed and never claims user evidence", () => {
  const result = summarize([]);
  assert.equal(result.status, "not_executed");
  assert.equal(result.release_ready, false);
  assert.equal(result.participant_count, 0);
});

test("three valid pseudonymous participants pass quantitative and review gates", () => {
  const records = threeRecords();
  assert.deepEqual(validateRecords(records), []);
  const result = summarize(records);
  assert.equal(result.status, "passed");
  assert.equal(result.release_ready, true);
  assert.equal(result.task_success_rate, 1);
  assert.equal(result.accepted_evidence_reviews, 3);
  assert.match(result.note, /not a population success-rate estimate/);
});

test("docs reviewers do not count toward the three core participants", () => {
  const records = [record("TEST-P01"), record("TEST-P02", "platform"), record("TEST-D01", "docs")];
  assert.deepEqual(validateRecords(records), []);
  const result = summarize(records);
  assert.equal(result.participant_count, 2);
  assert.equal(result.docs_participant_count, 1);
  assert.equal(result.gates.core_participants_3_to_5, false);
});

test("assisted completion is not counted as independent success", () => {
  const records = threeRecords();
  records.forEach((item) => { item.tasks.find((task) => task.id === "T1").help_used = true; });
  const result = summarize(records);
  assert.equal(result.tasks.find((task) => task.id === "T1").success_count, 0);
  assert.equal(result.gates.each_task_success_rate_at_least_80_percent, false);
});

test("safety misunderstanding blocks release", () => {
  const records = threeRecords();
  records[0].tasks[0].safety_misunderstanding = true;
  assert.deepEqual(validateRecords(records), []);
  const result = summarize(records);
  assert.equal(result.status, "failed");
  assert.equal(result.gates.no_safety_misunderstanding, false);
});

test("duplicate task ids and direct identifiers are rejected", () => {
  const duplicate = record("TEST-P01");
  duplicate.tasks[1].id = "T1";
  assert.ok(validateRecords([duplicate]).some((error) => error.includes("exactly once")));
  const identifier = record("TEST-P02");
  identifier.feedback.most_useful = ["Contact me at person@example.com"];
  assert.ok(validateRecords([identifier]).some((error) => error.includes("direct identifier")));
});

test("open serious issues and mixed commits block release", () => {
  const records = threeRecords();
  records[0].issues.push({
    id: "UXR-001", severity: "serious", location: "guide/05-tools-permissions",
    description: "Synthetic test issue", status: "open"
  });
  records[1].environment.site_commit_sha = "b".repeat(40);
  const errors = validateRecords(records);
  assert.ok(errors.some((error) => error.includes("same site_commit_sha")));
  const result = summarize(records);
  assert.equal(result.gates.no_open_critical_or_serious, false);
  assert.equal(result.gates.single_tested_commit, false);
});

test("timeout and first-correct timing inconsistencies are rejected", () => {
  const timeout = record("TEST-P01");
  timeout.tasks[0].timed_out = true;
  assert.ok(validateRecords([timeout]).some((error) => error.includes("timed_out")));
  const missingFirst = record("TEST-P02");
  missingFirst.tasks[0].first_correct_seconds = null;
  assert.ok(validateRecords([missingFirst]).some((error) => error.includes("first_correct_seconds")));
});

test("T3 artifacts and separate T4 mobile/print evidence are mandatory", () => {
  const missingArtifacts = record("TEST-P01");
  delete missingArtifacts.tasks.find((task) => task.id === "T3").artifacts;
  assert.ok(validateRecords([missingArtifacts]).some((error) => error.includes("artifacts")));
  const failedPrint = record("TEST-P02");
  failedPrint.tasks.find((task) => task.id === "T4").print_result.passed = false;
  assert.ok(validateRecords([failedPrint]).some((error) => error.includes("T4 success")));
});

test("evidence reviewer must be independent", () => {
  const participantReview = record("TEST-P01");
  participantReview.evidence_review.reviewer_id = participantReview.participant_id;
  assert.ok(validateRecords([participantReview]).some((error) => error.includes("independent")));
  const facilitatorReview = record("TEST-P02");
  facilitatorReview.evidence_review.reviewer_id = facilitatorReview.session.facilitator_id;
  assert.ok(validateRecords([facilitatorReview]).some((error) => error.includes("independent")));
});

test("one participant failing two tasks blocks release despite aggregate pass rate", () => {
  const records = threeRecords();
  for (const id of ["T1", "T2"]) {
    const task = records[0].tasks.find((item) => item.id === id);
    task.success = false;
    task.first_correct_seconds = null;
  }
  assert.deepEqual(validateRecords(records), []);
  const result = summarize(records);
  assert.ok(result.task_success_rate >= 0.8);
  assert.equal(result.gates.each_core_participant_passes_at_least_three_tasks, false);
});

test("rejected evidence review blocks release", () => {
  const records = threeRecords();
  records[0].evidence_review.decision = "rejected";
  const result = summarize(records);
  assert.equal(result.gates.independent_evidence_reviews_accepted, false);
  assert.equal(result.release_ready, false);
});
