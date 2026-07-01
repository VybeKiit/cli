#!/usr/bin/env tsx
/** One-shot DOM probe for LS dashboard — maintainer diagnostic only. */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const LS_DASHBOARD = 'https://app.lemonsqueezy.com/dashboard';
const CDP = 'http://localhost:9222';
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'logs');

type Candidate = {
  tag: string;
  role: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  textContent: string | null;
  type: string | null;
  visible: boolean;
  href: string | null;
};

async function main(): Promise<void> {
  const browser = await chromium.connectOverCDP(CDP, { timeout: 15_000 });
  const context = browser.contexts()[0];
  if (!context) throw new Error('No browser context on CDP');

  let page = context.pages().find((p) => p.url().includes('lemonsqueezy.com'));
  if (!page) {
    page = await context.newPage();
    await page.goto(LS_DASHBOARD, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  }

  await page.waitForURL(/lemonsqueezy\.com\/dashboard/, { timeout: 15_000 }).catch(() => undefined);

  const candidates = await page.evaluate((): Candidate[] => {
    const out: Candidate[] = [];
    const sel = 'input, textarea, select, button, a[href], [role="button"], [role="textbox"]';
    for (const el of Array.from(document.querySelectorAll(sel))) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const visible =
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        rect.width > 0 &&
        rect.height > 0;
      const tag = el.tagName.toLowerCase();
      out.push({
        tag,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        placeholder: el.getAttribute('placeholder'),
        textContent: (el.textContent ?? '').trim().slice(0, 120) || null,
        type: el.getAttribute('type'),
        visible,
        href: tag === 'a' ? (el as HTMLAnchorElement).href : null,
      });
    }
    return out.filter((c) => c.visible);
  });

  const payload = {
    url: page.url(),
    capturedAt: new Date().toISOString(),
    candidateCount: candidates.length,
    candidates,
  };

  await mkdir(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = resolve(OUT_DIR, `ls-dom-probe-${stamp}.json`);
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`OK: wrote ${candidates.length} visible candidates to ${outPath}`);
  await browser.close({ reason: 'ls dom probe complete' });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
