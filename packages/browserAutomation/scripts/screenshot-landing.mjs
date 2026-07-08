/**
 * Capture current landing page screenshots for design-comparison workflow.
 * Usage: node packages/browserAutomation/scripts/screenshot-landing.mjs [width] [host:port]
 */

import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingRoot = join(__dirname, '..', '..', '..', 'apps', 'landing');
const outDir = join(landingRoot, '.compare-tmp');

const width = Number(process.argv[2] ?? 1280);
const baseUrl = process.argv[3] ?? 'http://localhost:3333';
const viewport = { width, height: 900 };

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });
  await sleep(2500); // let framer motion / countdown start

  // Scroll through all sections to trigger viewport animations
  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const scrollSteps = 10;
  for (let i = 1; i <= scrollSteps; i++) {
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: 'instant' }),
      Math.floor((docHeight * i) / scrollSteps),
    );
    await sleep(400);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await sleep(500);

  // Full page
  const fullPath = join(outDir, `current-full-${width}.png`);
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log('saved full', fullPath);

  // Capture elements directly to avoid coordinate issues on tall pages
  async function captureSlice(name, selector) {
    const handle = await page.locator(selector).first();
    const count = await handle.count();
    if (count === 0) {
      console.log('  skipped', name, 'selector not found');
      return;
    }
    const path = join(outDir, `current-sec-${name}-${width}.png`);
    await handle.screenshot({ path });
    console.log('  captured', name, path);
  }

  await captureSlice('hero', '.hero-section', 0, 900);
  await captureSlice('featurestrip', '.feature-strip', 900, 640);
  await captureSlice('carousel', '#showcase', 1540, 1300);
  await captureSlice('zigzag', '.zigzag-row', 2840, 2600);
  await captureSlice('pricing', '#pricing', 5540, 900);
  await captureSlice('footer', 'footer', 6440, 1200);

  await browser.close();
  console.log(`Screenshots saved to ${outDir} at ${width}px width`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
