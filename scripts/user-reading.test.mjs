import test from "node:test";
import assert from "node:assert/strict";
import { summarize, validateRecords } from "./validate-user-reading.mjs";

function record(id, role = "sre") {
  return {
    schema_version: "1.0",
    participant_id: id,
    role,
    years_experience: 5,
    agent_project_experience: true,
    consent: true,
    environment: {
      desktop_viewport: "1440x900",
      mobile_viewport: "390x844",
      print_checked: true,
      site_commit_sha: "a".repeat(40),
      tested_at: "2026-11-25T10:00:00.000Z"
    },
    tasks: ["T1", "T2", "T3", "T4"].map((taskId) => ({
      id: taskId,
      success: true,
      time_seconds: taskId === "T3" ? 600 : 120,
      wrong_turns: 0,
      help_used: false,
      safety_misunderstanding: false,
      diagram_clarity: 4
    })),
    issues: [],
    feedback: { most_confusing: [], most_useful: [] }
  };
}

test("no records remains not_executed and never claims user evidence", () => {
  const result = summarize([]);
  assert.equal(result.status, "not_executed");
  assert.equal(result.release_ready, false);
  assert.equal(result.participant_count, 0);
});

test("three valid pseudonymous participants pass quantitative gates", () => {
  const records = [record("TEST-P01"), record("TEST-P02", "platform"), record("TEST-P03", "ai")];
  assert.deepEqual(validateRecords(records), []);
  const result = summarize(records);
  assert.equal(result.status, "passed");
  assert.equal(result.release_ready, true);
  assert.equal(result.task_success_rate, 1);
});

test("safety misunderstanding blocks release", () => {
  const records = [record("TEST-P01"), record("TEST-P02", "platform"), record("TEST-P03", "ai")];
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
  const records = [record("TEST-P01"), record("TEST-P02", "platform"), record("TEST-P03", "ai")];
  records[0].issues.push({
    id: "UXR-001",
    severity: "serious",
    location: "guide/05-tools-permissions",
    description: "Synthetic test issue",
    status: "open"
  });
  records[1].environment.site_commit_sha = "b".repeat(40);
  const errors = validateRecords(records);
  assert.ok(errors.some((error) => error.includes("same site_commit_sha")));
  const result = summarize(records);
  assert.equal(result.gates.no_open_critical_or_serious, false);
  assert.equal(result.gates.single_tested_commit, false);
});
