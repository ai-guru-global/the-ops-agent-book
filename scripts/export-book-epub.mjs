#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import epubModule from "epub-gen-memory";
import { ROUTES } from "./book-routes.mjs";

const epub = epubModule.default;

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PORT = 4178;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, "dist-epub");
const OUTPUT = path.join(OUT, "the-ops-agent-book-v0.2.0-rc1.epub");

function chromePath() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error("Chrome/Chromium not found; set CHROME_BIN");
  return found;
}

async function waitForServer() {
  for (let index = 0; index < 80; index += 1) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // starting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("preview server did not start");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = spawn("npm", ["run", "docs:preview", "--", "--port", String(PORT), "--host", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  const chapters = [];
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath: chromePath(), headless: true });
    for (const [index, [route, title]] of ROUTES.entries()) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      if (await page.locator(".mermaid").count()) {
        await page.waitForFunction(() => [...document.querySelectorAll(".mermaid")].every((node) => node.querySelector("svg")), { timeout: 30_000 });
      }
      const content = await page.evaluate(() => {
        const root = document.querySelector(".vp-doc") || document.querySelector(".book-home");
        if (!root) throw new Error("book content not found");
        const clone = root.cloneNode(true);
        clone.querySelectorAll(".header-anchor, .copy, button, .edit-link, .pager").forEach((node) => node.remove());
        clone.querySelectorAll("a[href]").forEach((anchor) => {
          const href = anchor.getAttribute("href") || "";
          if (!/^(https?:|mailto:)/.test(href)) anchor.removeAttribute("href");
        });
        return clone.innerHTML;
      });
      chapters.push({ title, content, filename: `chapter-${String(index + 1).padStart(2, "0")}.xhtml` });
      await page.close();
      console.log(`extracted ${index + 1}/${ROUTES.length} ${title}`);
    }
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }

  const css = `
    body { font-family: "IBM Plex Sans", "Noto Sans SC", "Microsoft YaHei", sans-serif; color: #161616; background: #ffffff; line-height: 1.75; }
    h1, h2, h3, h4 { color: #161616; line-height: 1.25; margin-top: 1.6em; }
    h1 { font-size: 1.8em; } h2 { font-size: 1.4em; border-top: 1px solid #e0e0e0; padding-top: .6em; }
    p, li { font-size: 1em; }
    a { color: #0f62fe; }
    table { width: 100%; border-collapse: collapse; font-size: .85em; }
    th, td { border: 1px solid #e0e0e0; padding: .4em; vertical-align: top; }
    th { background: #f4f4f4; color: #525252; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #ffffff; border: 1px solid #e0e0e0; padding: .8em; }
    code { font-family: "IBM Plex Mono", monospace; font-size: .9em; }
    figure { margin: 1.2em 0; border: 1px solid #e0e0e0; }
    figcaption, .custom-block-title { background: #f4f4f4; padding: .5em; color: #525252; }
    .mermaid { overflow-x: auto; padding: .8em; }
    svg { max-width: 100%; height: auto; }
    blockquote { border: 1px solid #e0e0e0; background: #f4f4f4; padding: .8em; }
  `;
  const buffer = await epub({
    title: "The Ops Agent Book v0.2.0-rc1",
    author: "ai-guru-global contributors",
    publisher: "ai-guru-global",
    description: "面向运维场景的智能体工程手册",
    lang: "zh-CN",
    date: "2026-11-25",
    cover: pathToFileURL(path.join(ROOT, "assets/preview.png")).href,
    css,
    version: 3,
    ignoreFailedDownloads: true,
  }, chapters);
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Exported ${OUTPUT} (${chapters.length} chapters, ${buffer.length} bytes).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
