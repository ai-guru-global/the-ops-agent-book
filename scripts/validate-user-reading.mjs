#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import YAML from "yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_DIR = path.join(ROOT, "reports/validation/user-reading-results");
const SCHEMA_PATH = path.join(ROOT, "schemas/user-reading-result.schema.json");
const TASK_IDS = ["T1", "T2", "T3", "T4"];
const TASK_LIMITS_SECONDS = { T1: 180, T2: 300, T3: 900, T4: 300 };
const CORE_CAPABILITIES = new Set(["k8s", "observability", "ai"]);

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function containsDirectIdentifier(value) {
  if (typeof value === "string") {
    return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value)
      || /(?<!\d)1[3-9]\d{9}(?!\d)/.test(value)
      || /(?<!\d)\+?\d{1,3}[-. ]\d{3}[-. ]\d{3}[-. ]\d{4}(?!\d)/.test(value);
  }
  if (Array.isArray(value)) return value.some(containsDirectIdentifier);
  if (value && typeof value === "object") return Object.values(value).some(containsDirectIdentifier);
  return false;
}

function independentlyPassed(task) {
  return task.success && !task.help_used;
}

export function validateRecords(records) {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const errors = [];
  const participantIds = new Set();
  const commits = new Set();

  records.forEach((record, index) => {
    const label = record?.participant_id || `record-${index + 1}`;
    if (!validate(record)) {
      for (const error of validate.errors ?? []) {
        errors.push(`${label}: ${error.instancePath || "/"} ${error.message}`);
      }
      return;
    }
    if (participantIds.has(record.participant_id)) errors.push(`${label}: duplicate participant_id`);
    participantIds.add(record.participant_id);
    commits.add(record.environment.site_commit_sha);

    const ids = record.tasks.map((task) => task.id);
    if (new Set(ids).size !== TASK_IDS.length || TASK_IDS.some((id) => !ids.includes(id))) {
      errors.push(`${label}: tasks must contain T1, T2, T3 and T4 exactly once`);
    }
    if (containsDirectIdentifier(record)) {
      errors.push(`${label}: direct identifier detected; anonymize before submission`);
    }
    if (record.evidence_review.reviewer_id === record.participant_id
      || record.evidence_review.reviewer_id === record.session.facilitator_id) {
      errors.push(`${label}: evidence reviewer must be independent of participant and facilitator`);
    }
    for (const task of record.tasks) {
      if (task.success && task.first_correct_seconds === null) {
        errors.push(`${label}: ${task.id} success requires first_correct_seconds`);
      }
      if (task.first_correct_seconds !== null && task.first_correct_seconds > task.time_seconds) {
        errors.push(`${label}: ${task.id} first_correct_seconds cannot exceed final time_seconds`);
      }
      if (task.timed_out && (task.success || task.time_seconds > TASK_LIMITS_SECONDS[task.id])) {
        errors.push(`${label}: ${task.id} timed_out must be unsuccessful and stop at the task limit`);
      }
      if (task.id === "T4" && task.success
        && (!task.mobile_result.passed || !task.print_result.passed)) {
        errors.push(`${label}: T4 success requires both mobile_result and print_result to pass`);
      }
    }
    const issueIds = record.issues.map((issue) => issue.id);
    if (new Set(issueIds).size !== issueIds.length) errors.push(`${label}: duplicate issue id`);
  });

  if (commits.size > 1) errors.push("all participants must test the same site_commit_sha");
  return errors;
}

export function summarize(records) {
  if (!records.length) {
    return {
      status: "not_executed",
      release_ready: false,
      participant_count: 0,
      note: "No real participant records found. Candidate tooling and synthetic checks are not user-test evidence."
    };
  }

  const coreRecords = records.filter((record) => record.role !== "docs");
  const docsRecords = records.filter((record) => record.role === "docs");
  const participantCount = coreRecords.length;
  const taskResults = TASK_IDS.map((id) => {
    const tasks = coreRecords.map((record) => record.tasks.find((task) => task.id === id));
    const passed = tasks.filter(independentlyPassed).length;
    return {
      id,
      success_count: passed,
      success_rate: participantCount ? passed / participantCount : 0,
      median_time_seconds: median(tasks.map((task) => task.time_seconds)),
      help_used_count: tasks.filter((task) => task.help_used).length,
      safety_misunderstanding_count: tasks.filter((task) => task.safety_misunderstanding).length
    };
  });
  const participantResults = coreRecords.map((record) => {
    const passed = record.tasks.filter(independentlyPassed).length;
    return { participant_id: record.participant_id, passed_tasks: passed, task_pass_rate: passed / TASK_IDS.length };
  });
  const totalTasks = participantCount * TASK_IDS.length;
  const successfulTasks = taskResults.reduce((sum, result) => sum + result.success_count, 0);
  const safetyCount = taskResults.reduce((sum, result) => sum + result.safety_misunderstanding_count, 0);
  const openSerious = records.flatMap((record) => record.issues)
    .filter((issue) => ["critical", "serious"].includes(issue.severity) && issue.status === "open").length;
  const capabilities = new Set(coreRecords.flatMap((record) => record.capabilities).filter((item) => CORE_CAPABILITIES.has(item)));
  const t3Within15Minutes = coreRecords.filter((record) => {
    const task = record.tasks.find((item) => item.id === "T3");
    return independentlyPassed(task) && task.time_seconds <= TASK_LIMITS_SECONDS.T3;
  }).length;
  const acceptedReviews = records.filter((record) => record.evidence_review.decision === "accepted"
    && record.evidence_review.anonymization_confirmed).length;
  const gates = {
    core_participants_3_to_5: participantCount >= 3 && participantCount <= 5,
    docs_participant_at_most_one: docsRecords.length <= 1,
    total_participants_at_most_six: records.length <= 6,
    capability_coverage_at_least_two: capabilities.size >= 2,
    task_success_rate_at_least_80_percent: totalTasks > 0 && successfulTasks / totalTasks >= 0.8,
    each_task_success_rate_at_least_80_percent: taskResults.every((result) => result.success_rate >= 0.8),
    each_core_participant_passes_at_least_three_tasks: participantResults.every((result) => result.passed_tasks >= 3),
    no_safety_misunderstanding: safetyCount === 0,
    at_least_three_t3_within_15_minutes: t3Within15Minutes >= Math.min(3, participantCount),
    no_open_critical_or_serious: openSerious === 0,
    independent_evidence_reviews_accepted: acceptedReviews === records.length,
    single_tested_commit: new Set(records.map((record) => record.environment.site_commit_sha)).size === 1
  };
  const releaseReady = Object.values(gates).every(Boolean);
  return {
    status: releaseReady ? "passed" : "failed",
    release_ready: releaseReady,
    participant_count: participantCount,
    docs_participant_count: docsRecords.length,
    tested_commit_sha: records[0].environment.site_commit_sha,
    total_tasks: totalTasks,
    successful_tasks: successfulTasks,
    task_success_rate: totalTasks ? successfulTasks / totalTasks : 0,
    t3_within_15_minutes: t3Within15Minutes,
    safety_misunderstanding_count: safetyCount,
    open_critical_or_serious: openSerious,
    capabilities_covered: [...capabilities],
    accepted_evidence_reviews: acceptedReviews,
    participants: participantResults,
    tasks: taskResults,
    gates,
    note: releaseReady
      ? "All PUB-04 gates pass for this 3–5 person sample; this is not a population success-rate estimate. Retain access-controlled raw evidence outside git."
      : "PUB-04 remains open. Resolve failed gates and retest affected participants."
  };
}

export function loadRecords(directory = DEFAULT_DIR) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => /\.ya?ml$/i.test(name))
    .sort()
    .map((name) => {
      const file = path.join(directory, name);
      const record = YAML.parse(fs.readFileSync(file, "utf8"));
      return { ...record, __source_file: name };
    });
}

function renderMarkdown(summary) {
  if (summary.status === "not_executed") {
    return `# 真实用户阅读测试汇总\n\n状态：**未执行**\n\n${summary.note}\n`;
  }
  const rows = summary.tasks.map((task) => `| ${task.id} | ${task.success_count}/${summary.participant_count} | ${(task.success_rate * 100).toFixed(1)}% | ${task.median_time_seconds ?? "—"} | ${task.help_used_count} | ${task.safety_misunderstanding_count} |`).join("\n");
  const gates = Object.entries(summary.gates).map(([name, passed]) => `| ${name} | ${passed ? "PASS" : "FAIL"} |`).join("\n");
  return `# 真实用户阅读测试汇总\n\n状态：**${summary.status}**  \nrelease_ready：**${summary.release_ready}**  \n测试提交：\`${summary.tested_commit_sha}\`\n\n${summary.note}\n\n## 任务指标\n\n| 任务 | 独立成功 | 核心参与者 | 样本任务通过率 | 中位耗时（秒） | 使用帮助 | 安全误解 |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows}\n\n## 门禁\n\n| 门禁 | 结果 |\n| --- | --- |\n${gates}\n`;
}

function main() {
  const args = process.argv.slice(2);
  const directoryIndex = args.indexOf("--dir");
  const directory = directoryIndex >= 0 ? path.resolve(args[directoryIndex + 1]) : DEFAULT_DIR;
  const write = args.includes("--write");
  const rawRecords = loadRecords(directory);
  const records = rawRecords.map(({ __source_file, ...record }) => record);
  const errors = validateRecords(records);
  if (errors.length) {
    console.error(`User-reading validation failed: ${errors.length} error(s)`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  const summary = summarize(records);
  if (write && records.length) {
    const jsonPath = path.join(ROOT, "reports/validation/user-reading-summary.json");
    const mdPath = path.join(ROOT, "reports/validation/user-reading-summary.md");
    fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
    fs.writeFileSync(mdPath, `${renderMarkdown(summary)}\n`);
    console.log(`Wrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, mdPath)}`);
  }
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status === "failed") process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
