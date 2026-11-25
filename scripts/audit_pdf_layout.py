#!/usr/bin/env python3
"""Audit generated PDF page geometry and text bounds using pdftotext."""
from __future__ import annotations

import argparse
import html
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = ROOT / "dist-pdf" / "the-ops-agent-book-v0.2.0-rc1.pdf"
DEFAULT_REPORT = ROOT / "reports" / "validation" / "pdf-layout.md"


def audit(pdf: Path) -> dict:
    if not pdf.exists():
        raise FileNotFoundError(f"PDF not found: {pdf}; run npm run export:pdf first")
    with tempfile.TemporaryDirectory(prefix="ops-book-pdf-audit-") as tmp:
        bbox = Path(tmp) / "book.html"
        subprocess.run(
            ["pdftotext", "-bbox-layout", str(pdf), str(bbox)],
            check=True,
            capture_output=True,
            text=True,
        )
        root = ET.parse(bbox).getroot()
    pages = []
    violations = []
    for index, page in enumerate(root.iter("{http://www.w3.org/1999/xhtml}page"), start=1):
        width = float(page.attrib["width"])
        height = float(page.attrib["height"])
        words = list(page.iter("{http://www.w3.org/1999/xhtml}word"))
        if not words:
            violations.append((index, "blank_page", "no extractable text"))
            continue
        xs_min = min(float(word.attrib["xMin"]) for word in words)
        ys_min = min(float(word.attrib["yMin"]) for word in words)
        xs_max = max(float(word.attrib["xMax"]) for word in words)
        ys_max = max(float(word.attrib["yMax"]) for word in words)
        if xs_min < -0.5 or ys_min < -0.5 or xs_max > width + 0.5 or ys_max > height + 0.5:
            violations.append((index, "out_of_bounds", f"bbox=({xs_min:.2f},{ys_min:.2f})-({xs_max:.2f},{ys_max:.2f}) page={width:.2f}x{height:.2f}"))
        if abs(width - 595.92) > 0.2 or abs(height - 842.88) > 0.2:
            violations.append((index, "unexpected_page_size", f"{width:.2f}x{height:.2f}"))
        pages.append({
            "page": index,
            "width": width,
            "height": height,
            "words": len(words),
            "left": xs_min,
            "top": ys_min,
            "right": xs_max,
            "bottom": ys_max,
        })
    return {
        "pdf": pdf,
        "page_count": len(pages),
        "word_count": sum(page["words"] for page in pages),
        "min_left": min((page["left"] for page in pages), default=0),
        "min_top": min((page["top"] for page in pages), default=0),
        "max_right": max((page["right"] for page in pages), default=0),
        "max_bottom": max((page["bottom"] for page in pages), default=0),
        "violations": violations,
    }


def render(result: dict) -> str:
    status = "PASS" if not result["violations"] else "FAIL"
    lines = [
        "# PDF 全量 A4 几何审计",
        "",
        f"状态：**{status}**",
        "",
        f"- PDF：`{result['pdf']}`",
        f"- 页数：**{result['page_count']}**",
        f"- 可提取文字数：**{result['word_count']}**",
        f"- 文字边界：left {result['min_left']:.2f} / top {result['min_top']:.2f} / right {result['max_right']:.2f} / bottom {result['max_bottom']:.2f} pt",
        "- 页面尺寸：全部应为 A4 `595.92 × 842.88 pt`。",
        "- 检查范围：空白页、文字越界、非 A4 页面。该检查不替代人工视觉审计，也不能证明图表语义、字体可读性或分页美观。",
        "",
    ]
    if result["violations"]:
        lines.extend(["## 违规", "", "| 页 | 类型 | 详情 |", "| --- | --- | --- |"])
        for page, kind, detail in result["violations"]:
            lines.append(f"| {page} | {html.escape(kind)} | {html.escape(detail)} |")
    else:
        lines.extend(["## 结论", "", "全部页面均为 A4，未发现空白页或文字越界。仍需人工抽查封面、长表、代码块、Mermaid 图与跨页断裂。"])
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", type=Path, default=DEFAULT_PDF)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    args = parser.parse_args()
    result = audit(args.pdf)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(render(result), encoding="utf-8")
    print(f"PDF layout audit: {result['page_count']} pages, {len(result['violations'])} violation(s), report={args.report}")
    if result["violations"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
