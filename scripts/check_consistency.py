#!/usr/bin/env python3
"""Cross-check durable book counts, status reports, and POC artifact hashes."""

from __future__ import annotations

import csv
import hashlib
import json
import re
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def sha256(relative: str) -> str:
    return hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()


with (ROOT / "reports/improvement-backlog.csv").open(newline="", encoding="utf-8") as handle:
    backlog = list(csv.DictReader(handle))

task_count = len(backlog)
person_days = sum((Decimal(row["estimate_person_days"]) for row in backlog), Decimal(0))
status_counts = {status: sum(row["status"] == status for row in backlog) for status in {row["status"] for row in backlog}}
completed = status_counts.get("completed", 0)
in_progress = status_counts.get("in_progress", 0)
not_started = status_counts.get("planned", 0) + status_counts.get("pending", 0)
require(task_count == completed + in_progress + not_started, "Backlog status counts do not sum to total tasks")

status = read("reports/improvement-status.md")
for label, value in (("总任务", task_count), ("已完成", completed), ("进行中", in_progress), ("未开始", not_started)):
    require(f"- {label}：{value}" in status, f"improvement-status.md has stale {label}: expected {value}")

plan = read("reports/improvement-plan.md")
require("初始计划快照" in plan, "improvement-plan.md must label its original 57-task snapshot")
require(f"**{task_count} 项、{person_days} 人日，{completed} 项完成、{in_progress} 项进行中**" in plan,
        "improvement-plan.md current backlog summary is stale")

appendix_count = len(list((ROOT / "docs/appendix").glob("*.md")))
product = read("PRODUCT.md")
require(f"{appendix_count} 个附录与案例页" in product,
        f"PRODUCT.md appendix/case page count is stale: expected {appendix_count}")

with (ROOT / "reports/chapter-scores-v3.csv").open(newline="", encoding="utf-8") as handle:
    scored_pages = list(csv.DictReader(handle))
page_count = len(scored_pages)
evaluation = read("reports/chapter-evaluation-v3.md")
require(f"{page_count}/{page_count} 页面进入七维评分" in evaluation,
        f"chapter-evaluation-v3.md scored-page total is stale: expected {page_count}")

reference_tests = len(re.findall(r"^test\(", read("examples/reference-agent/test/reference-agent.test.mjs"), re.MULTILINE))
require(reference_tests > 0, "No reference-agent tests found")
for relative in (
    "reports/improvement-status.md",
    "reports/re-evaluation.md",
    "reports/chapter-evaluation-v3.md",
):
    require(f"{reference_tests}/{reference_tests}" in read(relative),
            f"{relative} reference test count is stale: expected {reference_tests}/{reference_tests}")
require(re.search(rf"AUD-01,.*{reference_tests}/{reference_tests} tests", read("reports/improvement-backlog.csv")),
        f"backlog AUD-01 test count is stale: expected {reference_tests}/{reference_tests}")

pdf_report = read("reports/validation/pdf-layout.md")
pdf_match = re.search(r"页数：\*\*(\d+)\*\*", pdf_report)
require(pdf_match is not None, "pdf-layout.md page count is missing")
if pdf_match:
    pdf_pages = int(pdf_match.group(1))
    homepage = read("docs/index.md")
    require(f"{pdf_pages} 页 A4 全书" in homepage,
            f"docs/index.md PDF page count is stale: expected {pdf_pages}")
    require(f"{pdf_pages} 页 PDF" in status and "几何审计" in status,
            f"improvement-status.md PDF page count is stale: expected {pdf_pages}")

poc = json.loads(read("examples/poc/reference-agent-poc.json"))
poc_markdown = read("examples/poc/reference-agent-poc.md")
require(poc.get("synthetic") is True, "POC must remain explicitly synthetic")
require(poc.get("production_ready") is False, "POC must remain not production-ready")
require(poc.get("final_decision") == "INCONCLUSIVE", "Synthetic POC decision must remain INCONCLUSIVE")
for artifact in poc.get("artifacts", []):
    relative = artifact["path"]
    expected = artifact["sha256"]
    require((ROOT / relative).is_file(), f"POC artifact is missing: {relative}")
    if (ROOT / relative).is_file():
        actual = sha256(relative)
        require(actual == expected, f"POC artifact hash mismatch: {relative}")
    require(f"| `{relative}` | `{expected}` |" in poc_markdown,
            f"POC Markdown artifact row is missing or stale: {relative}")

if errors:
    print("Consistency check failed:", file=sys.stderr)
    for error in errors:
        print(f"- {error}", file=sys.stderr)
    raise SystemExit(1)

print(
    "Consistency check passed: "
    f"{task_count} tasks ({completed} completed/{in_progress} in progress), "
    f"{person_days} person-days, {page_count} scored pages, "
    f"{reference_tests} reference tests, {pdf_pages} PDF pages, "
    f"{len(poc.get('artifacts', []))} POC hashes."
)
