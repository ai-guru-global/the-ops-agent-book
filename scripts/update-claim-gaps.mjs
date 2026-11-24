#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const GAP_FILE = path.join(ROOT, "sources/claim-gaps.json");
const REGISTRY_FILE = path.join(ROOT, "sources/registry.yaml");
const CLAIM_PATTERN = /\b(?:(?:GC|CN)-[A-Z]{1,4}-\d{2}|(?:OBS|SEC|FIN|VERT|ALI|NET)-\d{2}|EMB-[A-Z]{1,4}-\d{2})\b/g;

function vendorFiles() {
  const dir = path.join(ROOT, "docs/vendors");
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
  let withSources = 0;
  for (const claim of claims) {
    if (claim.source_ids?.length) withSources += 1;
    byPriority[claim.priority] = (byPriority[claim.priority] || 0) + 1;
    for (const page of claim.pages) byPage[page] = (byPage[page] || 0) + 1;
  }
  return {
    total_claims: claims.length,
    with_sources: withSources,
    without_sources: claims.length - withSources,
    by_page: Object.fromEntries(Object.entries(byPage).sort()),
    by_priority: Object.fromEntries(Object.entries(byPriority).sort()),
  };
}
export function updateClaimGaps() {
  const registry = parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
  const sources = registry.sources || [];
  const document = JSON.parse(fs.readFileSync(GAP_FILE, "utf8"));
  const claims = new Map(document.claims.map((claim) => [claim.claim_id, claim]));
  for (const file of vendorFiles()) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8").split("## 商业字段证据卡")[0];
    for (const line of text.split("\n")) {
      if (!line.startsWith("|") || !line.includes("未核实")) continue;
      const cells = line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      for (const match of line.matchAll(CLAIM_PATTERN)) {
        const claimId = match[0];
        const existing = claims.get(claimId) || {
          claim_id: claimId,
          product: productName(cells, claimId),
          pages: [],
          status: "needs_evidence",
          owner: "Vendor Researcher",
          priority: claimId.startsWith(("ALI-", "VERT-", "EMB-")) ? "P2" : "P1",
          last_checked: "2026-11-25",
          required_evidence: ["official_product_or_documentation", "pricing_or_licensing", "region_and_data_residency", "export_and_exit_terms"],
          closure_rule: "Close each field only with a citable official source and archived snapshot; unsupported fields remain unknown.",
          source_ids: [],
        };
        existing.pages = [...new Set([...existing.pages, file])];
        if (!existing.product || existing.product === claimId) existing.product = productName(cells, claimId);
        claims.set(claimId, existing);
      }
    }
  }
  const ordered = [...claims.values()].sort((a, b) => a.claim_id.localeCompare(b.claim_id));
  for (const claim of ordered) {
    claim.source_ids = sources.filter((source) => source.claims?.includes(claim.claim_id)).map((source) => source.source_id);
    claim.last_evidence_update = "2026-11-25";
  }
  document.updated_at = "2026-11-25";
  document.claims = ordered;
  document.summary = summary(ordered);
  fs.writeFileSync(GAP_FILE, `${JSON.stringify(document, null, 2)}\n`);
  return document.summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(updateClaimGaps(), null, 2));
}
