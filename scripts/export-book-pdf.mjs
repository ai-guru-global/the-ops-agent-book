#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ROUTES } from "./book-routes.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PORT = 4177;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, "dist-pdf");
const TMP = path.join(ROOT, ".pdf-tmp");
const OUTPUT = path.join(OUT, "the-ops-agent-book-v0.2.0-rc1.pdf");
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
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const server = spawn("npm", ["run", "docs:preview", "--", "--port", String(PORT), "--host", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch({ executablePath: chromePath(), headless: true });
    for (const [index, [route, title]] of ROUTES.entries()) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await page.goto(BASE + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      if (await page.locator(".mermaid").count()) {
        await page.waitForFunction(() => [...document.querySelectorAll(".mermaid")].every((node) => node.querySelector("svg")), { timeout: 30_000 });
      }
      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: path.join(TMP, `${String(index + 1).padStart(2, "0")}.pdf`),
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
      });
      await page.close();
      console.log(`rendered ${index + 1}/${ROUTES.length} ${title}`);
    }
  } finally {
    if (browser) await browser.close();
    server.kill("SIGTERM");
  }

  const merged = await PDFDocument.create();
  merged.setTitle("The Ops Agent Book v0.2.0-rc1");
  merged.setAuthor("ai-guru-global contributors");
  merged.setSubject("运维智能体工程手册");
  const outline = [];
  for (const [index, [route, title]] of ROUTES.entries()) {
    const part = await PDFDocument.load(fs.readFileSync(path.join(TMP, `${String(index + 1).padStart(2, "0")}.pdf`)));
    const pages = await merged.copyPages(part, part.getPageIndices());
    const start = merged.addPage(pages[0]);
    outline.push({ title, page: start });
    for (const page of pages.slice(1)) merged.addPage(page);
  }
  if (typeof merged.addOutline === "function") {
    for (const item of outline) merged.addOutline(item.title, item.page.ref);
  }
  const font = await merged.embedFont(StandardFonts.Helvetica);
  const pages = merged.getPages();
  for (const [index, page] of pages.entries()) {
    const text = `The Ops Agent Book · ${index + 1}/${pages.length}`;
    const width = font.widthOfTextAtSize(text, 8);
    page.drawText(text, { x: (page.getWidth() - width) / 2, y: 18, size: 8, font, color: rgb(0.35, 0.35, 0.35) });
  }
  fs.writeFileSync(OUTPUT, await merged.save());
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`Exported ${OUTPUT} (${pages.length} pages, ${fs.statSync(OUTPUT).size} bytes).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
