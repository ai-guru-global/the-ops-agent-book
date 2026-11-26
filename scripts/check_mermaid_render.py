#!/usr/bin/env python3
"""Render every Mermaid page in headless Chrome and verify SVG output."""

from __future__ import annotations

import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"


def chrome_binary() -> str:
    candidates = [
        os.environ.get("CHROME_BIN", ""),
        shutil.which("google-chrome"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    raise RuntimeError("Chrome/Chromium not found; set CHROME_BIN")


def route_for(file: Path) -> str:
    rel = file.relative_to(DOCS).with_suffix("")
    if rel.name == "index":
        rel = rel.parent
    return "/" + str(rel)


def expected_count(file: Path) -> int:
    return len(re.findall(r"```mermaid\b", file.read_text(encoding="utf-8")))


def main() -> int:
    files = sorted(
        file
        for file in DOCS.rglob("*.md")
        if ".vitepress" not in file.parts and expected_count(file) > 0
    )
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    base = f"http://127.0.0.1:{port}"
    server = subprocess.Popen(
        [
            shutil.which("node") or "node",
            str(ROOT / "node_modules/vitepress/bin/vitepress.js"),
            "preview", "docs", "--port", str(port), "--host", "127.0.0.1",
        ],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    failures: list[str] = []
    try:
        for _ in range(60):
            try:
                urllib.request.urlopen(base, timeout=1).close()
                break
            except Exception:
                time.sleep(0.25)
        else:
            raise RuntimeError("preview server did not start")

        chrome = chrome_binary()
        total = 0
        for index, file in enumerate(files):
            route = route_for(file)
            expected = expected_count(file)
            total += expected
            with tempfile.TemporaryDirectory(prefix="book-chrome-") as profile:
                command = [
                    chrome,
                    "--headless=new",
                    "--disable-gpu",
                    "--no-first-run",
                    f"--user-data-dir={profile}",
                    "--virtual-time-budget=9000",
                    "--dump-dom",
                    base + route,
                ]
                if sys.platform.startswith("linux"):
                    command.append("--no-sandbox")
                result = subprocess.run(command, capture_output=True, text=True, timeout=60)
            html = result.stdout
            blocks = re.findall(r'<div class="mermaid"[^>]*>(.*?)</div>', html, re.S)
            rendered = sum(1 for block in blocks if "<svg" in block)
            syntax_error = "Syntax error" in html or "mermaid version" in html
            if result.returncode == 0 and rendered == 0 and not syntax_error:
                # A cold Chrome profile can occasionally dump before Mermaid's
                # asynchronous module executes. Retry once with a fresh profile.
                with tempfile.TemporaryDirectory(prefix="book-chrome-retry-") as profile:
                    retry = list(command)
                    profile_index = next(i for i, value in enumerate(retry) if value.startswith("--user-data-dir="))
                    retry[profile_index] = f"--user-data-dir={profile}"
                    retry[retry.index("--virtual-time-budget=9000")] = "--virtual-time-budget=15000"
                    result = subprocess.run(retry, capture_output=True, text=True, timeout=60)
                html = result.stdout
                blocks = re.findall(r'<div class="mermaid"[^>]*>(.*?)</div>', html, re.S)
                rendered = sum(1 for block in blocks if "<svg" in block)
                syntax_error = "Syntax error" in html or "mermaid version" in html
            if result.returncode != 0 or rendered != expected or syntax_error:
                failures.append(
                    f"{file.relative_to(ROOT)} {route}: expected {expected}, rendered {rendered}, "
                    f"exit={result.returncode}, syntax_error={syntax_error}"
                )
            else:
                print(f"ok {route}: {rendered} diagram(s)")
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    if failures:
        print("Mermaid render check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    print(f"Mermaid render check passed: {total} diagrams across {len(files)} pages.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
