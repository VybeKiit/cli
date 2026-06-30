#!/usr/bin/env tsx
/** Probe all open Lemon Squeezy tabs — maintainer diagnostic. */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

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
  name: string | null;
  id: string | null;
};

async function probePage(page: import('playwright').Page): Promise<Candidate[]> {
  return page.evaluate((): Candidate[] => {
    const out: Candidate[] = [];
    const sel =
      'input, textarea, select, button, a[href], [role="button"], [role="textbox"], [role="link"], [role="combobox"]';
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
        textContent: (el.textContent ?? '').trim().slice(0, 160) || null,
        type: el.getAttribute('type'),
        visible,
        href: tag === 'a' ? (el as HTMLAnchorElement).href : null,
        name: el.getAttribute('name'),
        id: el.id || null,
      });
    }
    return out.filter((c) => c.visible);
  });
}

async function main(): Promise<void> {
  const browser = await chromium.connectOverCDP(CDP, { timeout: 15_000 });
  const context = browser.contexts()[0];
  if (!context) throw new Error('No browser context on CDP');

  const lsPages = context.pages().filter((p) => p.url().includes('lemonsqueezy.com'));
  if (lsPages.length === 0) throw new Error('No Lemon Squeezy tabs open in CDP Chrome.');

  const tabs = [];
  for (const page of lsPages) {
    const candidates = await probePage(page);
    tabs.push({
      url: page.url(),
      title: await page.title(),
      candidateCount: candidates.length,
      candidates,
    });
  }

  const payload = { capturedAt: new Date().toISOString(), tabCount: tabs.length, tabs };
  await mkdir(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = resolve(OUT_DIR, `ls-dom-probe-all-tabs-${stamp}.json`);
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`OK: probed ${tabs.length} tab(s) → ${outPath}`);
  for (const t of tabs) {
    console.log(`  ${t.url} — ${t.candidateCount} elements`);
  }
  await browser.close({ reason: 'ls multi-tab probe complete' });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
