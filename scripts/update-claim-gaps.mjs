#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CLAIM_PATTERN = /\b(?:(?:GC|CN)-[A-Z]{1,4}-\d{2}|(?:OBS|SEC|FIN|VERT|ALI|NET)-\d{2}|EMB-[A-Z]{1,4}-\d{2})\b/g;
const FIELD_DEFINITIONS = {
  status: "产品/能力状态",
  region: "区域与可用性",
  licensing_pricing: "许可与计费单位",
  minimum_overage: "最低消费与超额",
  data_residency: "数据驻留与保留",
  export_exit: "导出、退出与删除",
  other: "其他未核实字段",
};

function cellsOf(line) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function fieldKey(label) {
  if (/状态|GA|预览|preview/i.test(label)) return "status";
  if (/区域|地域|region|location/i.test(label)) return "region";
  if (/最低|超额|overage/i.test(label)) return "minimum_overage";
  if (/驻留|residency|保留|retention/i.test(label)) return "data_residency";
  if (/导出|退出|删除|export|exit|delet/i.test(label)) return "export_exit";
  if (/许可|计费|定价|授权|license|pricing/i.test(label)) return "licensing_pricing";
  return "other";
}

function vendorFiles(root = ROOT) {
  const dir = path.join(root, "docs/vendors");
  return [...fs.readdirSync(dir).filter((file) => file.endsWith(".md")).map((file) => `docs/vendors/${file}`), "docs/appendix/alibaba-agent-landscape.md"];
}
function productName(cells, claimId) {
  for (const cell of cells) {
    if (!cell.includes(claimId)) continue;
    const bold = cell.match(/\*\*(.*?)\*\*/);
    if (bold) return bold[1];
    return cell.split(/[（(]/, 1)[0].replace(/\s+/g, " ").trim();
  }
  return claimId;
}
function summary(claims) {
  const byPage = {};
  const byPriority = {};
  const unverifiedFieldCounts = Object.fromEntries(Object.keys(FIELD_DEFINITIONS).map((key) => [key, 0]));
  let withSources = 0;
  for (const claim of claims) {
    if (claim.source_ids?.length) withSources += 1;
    byPriority[claim.priority] = (byPriority[claim.priority] || 0) + 1;
    for (const page of claim.pages) byPage[page] = (byPage[page] || 0) + 1;
    for (const field of claim.unverified_fields || []) {
      unverifiedFieldCounts[field] = (unverifiedFieldCounts[field] || 0) + 1;
    }
  }
  return {
    total_claims: claims.length,
    with_sources: withSources,
    without_sources: claims.length - withSources,
    by_page: Object.fromEntries(Object.entries(byPage).sort()),
    by_priority: Object.fromEntries(Object.entries(byPriority).sort()),
    unverified_field_counts: unverifiedFieldCounts,
  };
}
export function updateClaimGaps(root = ROOT) {
  const gapFile = path.join(root, "sources/claim-gaps.json");
  const registryFile = path.join(root, "sources/registry.yaml");
  const registry = parse(fs.readFileSync(registryFile, "utf8"));
  const sources = registry.sources || [];
  const document = JSON.parse(fs.readFileSync(gapFile, "utf8"));
  const claims = new Map(document.claims.map((claim) => [claim.claim_id, claim]));
  const openClaimIds = new Set();
  // Rebuild page membership from the current documents; verified fields must not
  // leave stale pages or closed claims in the gap register.
  for (const claim of claims.values()) {
    claim.pages = [];
    claim.unverified_fields = [];
  }
  for (const file of vendorFiles(root)) {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    let headers = [];
    let previousCells = [];
    for (const line of text.split("\n")) {
      if (!line.startsWith("|")) continue;
      const cells = cellsOf(line);
      if (cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
        headers = previousCells;
        previousCells = [];
        continue;
      }
      previousCells = cells;
      if (!line.includes("未核实")) continue;
      const unverified = cells.map((cell, index) => cell.includes("未核实") ? fieldKey(headers[index] || `column_${index}`) : null)
        .filter(Boolean);
      for (const match of line.matchAll(CLAIM_PATTERN)) {
        const claimId = match[0];
        const existing = claims.get(claimId) || {
          claim_id: claimId,
          product: productName(cells, claimId),
          pages: [],
          status: "needs_evidence",
          owner: "Vendor Researcher",
          priority: claimId.startsWith(("ALI-", "VERT-", "EMB-")) ? "P2" : "P1",
          last_checked: "2026-11-26",
          required_evidence: ["official_product_or_documentation", "pricing_or_licensing", "region_and_data_residency", "export_and_exit_terms"],
          closure_rule: "Close each field only with a citable official source and archived snapshot; unsupported fields remain unknown.",
          source_ids: [],
          unverified_fields: [],
        };
        existing.pages = [...new Set([...existing.pages, file])].sort();
        existing.unverified_fields = [...new Set([...existing.unverified_fields, ...unverified])].sort();
        openClaimIds.add(claimId);
        if (!existing.product || existing.product === claimId) existing.product = productName(cells, claimId);
        claims.set(claimId, existing);
      }
    }
  }
  const ordered = [...claims.values()].filter((claim) => openClaimIds.has(claim.claim_id))
    .sort((a, b) => a.claim_id.localeCompare(b.claim_id));
  for (const claim of ordered) {
    claim.source_ids = sources.filter((source) => source.claims?.includes(claim.claim_id)).map((source) => source.source_id);
    claim.last_evidence_update = "2026-11-26";
  }
  document.updated_at = "2026-11-26";
  document.field_definitions = FIELD_DEFINITIONS;
  document.claims = ordered;
  document.summary = summary(ordered);
  fs.writeFileSync(gapFile, `${JSON.stringify(document, null, 2)}\n`);
  return document.summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(updateClaimGaps(), null, 2));
}
