import test from "node:test";
import assert from "node:assert/strict";
import { renderClaimGapSummary } from "./generate-claim-gap-summary.mjs";

test("claim gap summary renders field counts and ranked claims", () => {
  const markdown = renderClaimGapSummary({
    updated_at: "2026-11-26",
    field_definitions: { status: "状态", export_exit: "导出/退出" },
    summary: { unverified_field_counts: { status: 2, export_exit: 1 } },
    claims: [
      { claim_id: "FIN-01", product: "Cloudability", priority: "P1", unverified_fields: ["status"], source_ids: ["SRC-IBM-CLOUDABILITY-001"] },
      { claim_id: "GC-AWS-04", product: "AgentCore", priority: "P1", unverified_fields: ["status", "export_exit"], source_ids: ["SRC-AWS-AGENTCORE-001"] }
    ]
  });
  assert.match(markdown, /开放 claim：2/);
  assert.match(markdown, /未核实字段计数：3/);
  assert.match(markdown, /\| status \| 状态 \| 2 \|/);
  assert.ok(markdown.indexOf("GC-AWS-04") < markdown.indexOf("FIN-01"));
});
