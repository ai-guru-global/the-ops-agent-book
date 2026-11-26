#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const INPUT = path.join(ROOT, "sources/claim-gaps.json");
const OUTPUT = path.join(ROOT, "reports/validation/claim-gap-summary.md");

export function renderClaimGapSummary(document) {
  const claims = document.claims || [];
  const definitions = document.field_definitions || {};
  const counts = document.summary?.unverified_field_counts || {};
  const fieldRows = Object.entries(definitions).map(([key, label]) =>
    `| ${key} | ${label} | ${counts[key] || 0} |`).join("\n");
  const ranked = [...claims].sort((a, b) =>
    (b.unverified_fields?.length || 0) - (a.unverified_fields?.length || 0)
    || a.claim_id.localeCompare(b.claim_id));
  const claimRows = ranked.slice(0, 25).map((claim) =>
    `| ${claim.claim_id} | ${claim.product} | ${claim.priority} | ${(claim.unverified_fields || []).join(", ")} | ${(claim.source_ids || []).length} |`).join("\n");
  return `# 厂商 claim 缺口摘要\n\n- 更新日期：${document.updated_at}\n- 开放 claim：${claims.length}\n- P1：${claims.filter((claim) => claim.priority === "P1").length}\n- P2：${claims.filter((claim) => claim.priority === "P2").length}\n- 已绑定至少一个来源：${claims.filter((claim) => (claim.source_ids || []).length > 0).length}\n- 未核实字段计数：${Object.values(counts).reduce((sum, value) => sum + value, 0)}\n\n本摘要由 \`scripts/generate-claim-gap-summary.mjs\` 从 [claim-gaps.json](../../sources/claim-gaps.json) 生成；字段计数按 claim 计，同一 claim 的同一字段只计一次。完整记录与 closure rule 以机器可读注册表为准。\n\n## 逐字段缺口\n\n| 字段 | 含义 | claim 数 |\n| --- | --- | ---: |\n${fieldRows}\n\n## 缺口最多的 25 个 claim\n\n| claim | 产品 | 优先级 | 未核实字段 | 来源数 |\n| --- | --- | --- | --- | ---: |\n${claimRows}\n`;
}

export function generateClaimGapSummary(root = ROOT) {
  const document = JSON.parse(fs.readFileSync(path.join(root, "sources/claim-gaps.json"), "utf8"));
  const output = path.join(root, "reports/validation/claim-gap-summary.md");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderClaimGapSummary(document));
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Generated ${path.relative(ROOT, generateClaimGapSummary())}`);
}
