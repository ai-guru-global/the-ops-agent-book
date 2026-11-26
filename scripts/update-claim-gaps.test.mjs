import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { updateClaimGaps } from "./update-claim-gaps.mjs";

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "claim-gaps-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ["sources", "docs/vendors", "docs/appendix"]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  fs.writeFileSync(path.join(root, "sources/registry.yaml"), `sources:\n  - source_id: SRC-AWS-DEVOPS-001\n    claims: [GC-AWS-01]\n`);
  fs.writeFileSync(path.join(root, "docs/vendors/global-cloud.md"), [
    "| claim | status | region | licensing/pricing |",
    "| --- | --- | --- | --- |",
    "| GC-AWS-01 | GA | 未核实 | 未核实 |",
    ""
  ].join("\n"));
  fs.writeFileSync(path.join(root, "docs/appendix/alibaba-agent-landscape.md"), "| ALI-01 | 已核实 |\n");
  fs.writeFileSync(path.join(root, "sources/claim-gaps.json"), JSON.stringify({
    schema_version: "1.0",
    claims: [
      { claim_id: "GC-AWS-01", product: "AWS DevOps Agent", pages: ["docs/vendors/stale.md"], status: "needs_evidence", priority: "P1", source_ids: [] },
      { claim_id: "FIN-05", product: "Closed claim", pages: ["docs/vendors/stale.md"], status: "needs_evidence", priority: "P1", source_ids: [] }
    ]
  }, null, 2));
  return root;
}

test("claim gap register removes closed claims and rebuilds current page membership", (t) => {
  const root = fixture(t);
  const summary = updateClaimGaps(root);
  const document = JSON.parse(fs.readFileSync(path.join(root, "sources/claim-gaps.json"), "utf8"));
  assert.equal(summary.total_claims, 1);
  assert.deepEqual(document.claims.map((claim) => claim.claim_id), ["GC-AWS-01"]);
  assert.deepEqual(document.claims[0].pages, ["docs/vendors/global-cloud.md"]);
  assert.deepEqual(document.claims[0].source_ids, ["SRC-AWS-DEVOPS-001"]);
  assert.deepEqual(document.claims[0].unverified_fields, ["licensing_pricing", "region"]);
  assert.equal(document.summary.unverified_field_counts.region, 1);
  assert.equal(document.summary.unverified_field_counts.licensing_pricing, 1);
  assert.equal(document.summary.unverified_field_counts.status, 0);
});

test("claim gap register becomes empty when every field is verified", (t) => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, "docs/vendors/global-cloud.md"), [
    "| claim | status | region | licensing/pricing |",
    "| --- | --- | --- | --- |",
    "| GC-AWS-01 | GA | us-east-1 | pay-as-you-go |",
    ""
  ].join("\n"));
  const summary = updateClaimGaps(root);
  const document = JSON.parse(fs.readFileSync(path.join(root, "sources/claim-gaps.json"), "utf8"));
  assert.equal(summary.total_claims, 0);
  assert.deepEqual(document.claims, []);
});
