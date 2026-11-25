#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const REGISTRY = path.join(ROOT, "sources/registry.yaml");
const TARGET = path.join(ROOT, "docs/appendix/references.md");
const BEGIN = "<!-- BEGIN GENERATED REFERENCES -->";
const END = "<!-- END GENERATED REFERENCES -->";

const GROUPS = [
  ["阿里 Agent 产品与生态", (claim) => claim.startsWith("ALI-")],
  ["全球云厂商", (claim) => claim.startsWith("GC-")],
  ["中国云厂商", (claim) => claim.startsWith("CN-")],
  ["可观测与 AIOps", (claim) => claim.startsWith("OBS-")],
  ["安全与 SecOps", (claim) => claim.startsWith("SEC-")],
  ["FinOps", (claim) => claim.startsWith("FIN-")],
  ["网络与云网", (claim) => claim.startsWith("NET-")],
  ["内嵌 Agent 助手", (claim) => claim.startsWith("EMB-")],
  ["垂直行业运维", (claim) => claim.startsWith("VERT-")],
  ["方法、标准与协议", (claim) => claim.startsWith("METH-") || claim.startsWith("PROTO-")],
];

function groupFor(source) {
  const claims = source.claims || [];
  for (const [name, predicate] of GROUPS) {
    if (claims.some(predicate)) return name;
  }
  return "其他公开来源";
}

function cell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function render(registry) {
  const sources = [...(registry.sources || [])].sort((a, b) => a.source_id.localeCompare(b.source_id));
  const grouped = new Map();
  for (const source of sources) {
    const name = groupFor(source);
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push(source);
  }
  const order = [...GROUPS.map(([name]) => name), "其他公开来源"];
  const lines = [
    BEGIN,
    "## 注册表来源（自动生成）",
    "",
    `以下 ${sources.length} 条来源直接由 \`sources/registry.yaml\` 生成；URL、类型、claim、访问日与快照状态均不在本页手工维护。官方营销页只证明厂商宣称，不证明生产效果或采购就绪。`,
    "",
  ];
  for (const name of order) {
    const rows = grouped.get(name);
    if (!rows?.length) continue;
    lines.push(`### ${name}`, "", "| source_id | 来源 | 类型 / claim | 访问日 | 快照 |", "| --- | --- | --- | --- | --- |");
    for (const source of rows) {
      const title = `[${cell(source.title)}](${source.url})`;
      const claims = (source.claims || []).join("、") || "无确定性 claim";
      const snapshot = source.snapshot ? `已存 \`${cell(source.snapshot.path)}\`` : "待存 / 仅入口";
      lines.push(`| ${cell(source.source_id)} | ${title} | ${cell(source.type)} / ${cell(claims)} | ${cell(source.accessed_at)} | ${snapshot} |`);
    }
    lines.push("");
  }
  lines.push(END);
  return lines.join("\n");
}

export function generateReferences({ check = false } = {}) {
  const registry = parse(fs.readFileSync(REGISTRY, "utf8"));
  const section = render(registry);
  const current = fs.readFileSync(TARGET, "utf8");
  const start = current.indexOf(BEGIN);
  const end = current.indexOf(END);
  if (start < 0 || end < 0 || end < start) throw new Error("reference markers are missing from docs/appendix/references.md");
  const next = `${current.slice(0, start)}${section}${current.slice(end + END.length)}`;
  if (check) {
    if (next !== current) throw new Error("generated references are stale; run npm run refs:generate");
    return { status: "current", sources: registry.sources.length };
  }
  fs.writeFileSync(TARGET, next);
  return { status: "generated", sources: registry.sources.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(generateReferences({ check: process.argv.includes("--check") }));
}
