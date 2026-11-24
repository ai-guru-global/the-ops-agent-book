#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PORT = 4176;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, "reports/validation");
const PAGES = ["/", "/guide/05-tools-permissions", "/playbooks/k8s", "/vendors/observability-aiops"];
const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

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
  const results = [];
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath: chromePath(), headless: true });
    for (const route of PAGES) {
      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        await page.goto(BASE + route, { waitUntil: "networkidle" });
        await page.waitForTimeout(700);
        const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        results.push({
          route,
          width: viewport.width,
          violations: scan.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.length,
            targets: violation.nodes.slice(0, 5).map((node) => node.target),
          })),
        });
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }
  const blocking = results.flatMap((result) => result.violations.filter((violation) => ["critical", "serious"].includes(violation.impact)).map((violation) => ({ ...result, ...violation })));
  const lines = [
    "# 无障碍审计",
    "",
    "| 页面 | 宽度 | 严重/阻断 | 其他问题 |",
    "| --- | ---: | ---: | ---: |",
    ...results.map((result) => {
      const severe = result.violations.filter((violation) => ["critical", "serious"].includes(violation.impact)).length;
      return `| ${result.route} | ${result.width} | ${severe} | ${result.violations.length - severe} |`;
    }),
    "",
  ];
  for (const result of results) {
    if (!result.violations.length) continue;
    lines.push(`## ${result.route} @ ${result.width}px`, "");
    for (const violation of result.violations) lines.push(`- **${violation.impact}** ${violation.id}: ${violation.help}（${violation.nodes} 个节点）`);
    lines.push("");
  }
  fs.writeFileSync(path.join(OUT, "accessibility.md"), `${lines.join("\n")}\n`);
  fs.writeFileSync(path.join(OUT, "accessibility.json"), `${JSON.stringify(results, null, 2)}\n`);
  if (blocking.length) {
    console.error(`Accessibility audit failed: ${blocking.length} serious/critical finding(s)`);
    for (const item of blocking) console.error(`- ${item.route}@${item.width} ${item.id}: ${item.help}`);
    process.exit(1);
  }
  console.log(`Accessibility audit passed: ${results.length} page/viewport combinations; no serious/critical violations.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
