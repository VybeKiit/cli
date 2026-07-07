/**
 * Capture current landing page screenshots for design-comparison workflow.
 * Usage: node scripts/screenshot-landing.mjs [width] [host:port]
 */

import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, '.compare-tmp');

const rawWidth = process.argv[2];
const rawBaseUrl = process.argv[3];
const width = Number(rawWidth === undefined ? 1280 : rawWidth);
const baseUrl = rawBaseUrl === undefined ? 'http://localhost:3333' : rawBaseUrl;
const viewport = { width, height: 900 };

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });
  await sleep(2500); // let framer motion / countdown start

  // Full page
  await page.screenshot({ path: join(outDir, `current-full-${width}.png`), fullPage: true });

  // Helper to capture a vertical slice
  const captureSlice = async (name, top, height) => {
    await page.screenshot({
      path: join(outDir, `current-sec-${name}-${width}.png`),
      clip: { x: 0, y: top, width, height },
    });
  };

  // Scroll-trigger sections so mockups animate in before cropping
  const sectionTops = [
    ['hero', 0, 900],
    ['featurestrip', 900, 640],
    ['carousel', 1540, 1300],
    ['zigzag1', 2840, 900],
    ['zigzag2', 3740, 900],
    ['zigzag3', 4640, 900],
    ['pricing', 5540, 900],
    ['footer', 6440, 1200],
  ];

  for (const [name, top, height] of sectionTops) {
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), top);
    await sleep(1200);
    await captureSlice(name, top, height);
  }

  await browser.close();
  process.stdout.write(`Screenshots saved to ${outDir} at ${width}px width\n`);
};

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
  process.exit(1);
});
