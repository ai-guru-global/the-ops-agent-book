#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, "reports/validation/responsive");
const VIEWPORTS = [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
  { width: 1440, height: 1000 },
];
const PAGES = [
  { route: "/", name: "home", diagrams: 0 },
  { route: "/guide/05-tools-permissions", name: "tools", diagrams: 2 },
  { route: "/playbooks/k8s", name: "k8s", diagrams: 1 },
  { route: "/vendors/observability-aiops", name: "vendors", diagrams: 1 },
  { route: "/templates/permission-matrix", name: "template", diagrams: 1 },
  { route: "/appendix/case-notready", name: "case", diagrams: 1 },
];

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
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {
      // server is still starting
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("preview server did not start");
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(ROOT, "reports/validation/print"), { recursive: true });
  const server = spawn("npm", ["run", "docs:preview", "--", "--port", String(PORT), "--host", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore",
  });
  const failures = [];
  const rows = [];
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath: chromePath(), headless: true });
    for (const pageDef of PAGES) {
      for (const viewport of VIEWPORTS) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
        await page.goto(BASE + pageDef.route, { waitUntil: "networkidle" });
        await page.waitForTimeout(800);
        const metrics = await page.evaluate(() => ({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          diagrams: document.querySelectorAll(".mermaid svg").length,
          emptyDiagrams: [...document.querySelectorAll(".mermaid")].filter((node) => !node.querySelector("svg")).length,
          title: document.title,
          h1: document.querySelector("h1")?.textContent?.trim() || "",
        }));
        const overflow = metrics.scrollWidth > metrics.innerWidth + 1 || metrics.bodyScrollWidth > metrics.innerWidth + 1;
        const diagramMismatch = metrics.diagrams !== pageDef.diagrams || metrics.emptyDiagrams !== 0;
        const blank = !metrics.h1 && !metrics.title;
        if (overflow || diagramMismatch || blank) {
          failures.push(`${pageDef.name}@${viewport.width}: overflow=${overflow}, diagrams=${metrics.diagrams}/${pageDef.diagrams}, blank=${blank}`);
        }
        rows.push({ page: pageDef.name, width: viewport.width, scrollWidth: metrics.scrollWidth, diagrams: metrics.diagrams, status: overflow || diagramMismatch || blank ? "FAIL" : "PASS" });
        if (["home", "tools"].includes(pageDef.name) && [320, 390, 768, 1440].includes(viewport.width)) {
          await page.screenshot({ path: path.join(OUT, `${pageDef.name}-${viewport.width}.png`), fullPage: false });
        }
        await page.close();
      }
    }
    const printPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await printPage.goto(BASE + "/guide/05-tools-permissions", { waitUntil: "networkidle" });
    await printPage.waitForTimeout(1000);
    await printPage.pdf({ path: path.join(ROOT, "reports/validation/print/guide-05.pdf"), format: "A4", printBackground: true });
    await printPage.close();
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }

  const lines = [
    "# 响应式与打印验证",
    "",
    "| 页面 | 宽度 | scrollWidth | Mermaid SVG | 结果 |",
    "| --- | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.page} | ${row.width} | ${row.scrollWidth} | ${row.diagrams} | ${row.status} |`),
    "",
    "打印样本：`reports/validation/print/guide-05.pdf`（A4，等待 Mermaid 渲染后生成）。",
  ];
  fs.writeFileSync(path.join(ROOT, "reports/validation/responsive.md"), `${lines.join("\n")}\n`);
  if (failures.length) {
    console.error(`Responsive check failed: ${failures.length} case(s)`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Responsive check passed: ${rows.length} page/viewport combinations; print sample generated.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
