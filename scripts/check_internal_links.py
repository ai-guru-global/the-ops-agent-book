#!/usr/bin/env python3
"""Check internal Markdown and VitePress navigation links resolve to a file."""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"


def content_files() -> list[Path]:
    return sorted(
        path for path in DOCS.rglob("*.md") if ".vitepress" not in path.parts
    )


def candidates(target: Path) -> list[Path]:
    if target.suffix == ".html":
        target = target.with_suffix(".md")
    return [
        target,
        Path(f"{target}.md"),
        Path(f"{target}.html"),
        target / "index.md",
        target / "index.html",
    ]


def check_link(source: Path, link: str) -> str | None:
    clean = link.split("#", 1)[0].split("?", 1)[0].strip()
    if not clean or re.match(r"^(https?:|mailto:|tel:)", clean):
        return None
    if clean.startswith("/"):
        target = DOCS / clean.lstrip("/")
    else:
        target = source.parent / clean
    target = Path(os.path.normpath(target))
    if any(path.exists() for path in candidates(target)):
        return None
    return f"{source.relative_to(ROOT)} -> {link}"


def markdown_links(source: Path) -> list[str]:
    text = source.read_text(encoding="utf-8")
    return [match.group(1) for match in re.finditer(r"\]\(([^)\s]+)", text)]


def config_links() -> list[str]:
    config = DOCS / ".vitepress" / "config.mts"
    if not config.exists():
        return []
    text = config.read_text(encoding="utf-8")
    return re.findall(r'link:\s*"([^"]+)"', text)


def main() -> int:
    problems: list[str] = []
    for source in content_files():
        for link in markdown_links(source):
            problem = check_link(source, link)
            if problem:
                problems.append(problem)

    config = DOCS / ".vitepress" / "config.mts"
    for link in config_links():
        problem = check_link(config, link)
        if problem:
            problems.append(problem)

    if problems:
        print(f"Found {len(problems)} broken internal link(s):")
        for problem in problems:
            print(f"  - {problem}")
        return 1

    print("All internal links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
