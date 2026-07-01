#!/usr/bin/env tsx
/** DOM probe for Namecheap / GoDaddy registrar dashboards — maintainer diagnostic only. */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'logs');

type Target = {
  id: 'nc' | 'gd';
  cdp: string;
  urlPattern: RegExp;
  startUrl: string;
};

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

async function probeTarget(target: Target): Promise<string> {
  const browser = await chromium.connectOverCDP(target.cdp, { timeout: 15_000 });
  const context = browser.contexts()[0];
  if (!context) throw new Error(`No browser context on ${target.cdp}`);

  let page = context.pages().find((p) => target.urlPattern.test(p.url()));
  if (!page) {
    page = await context.newPage();
    await page.goto(target.startUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  }

  await page.waitForTimeout(2000);

  const candidates = await page.evaluate((): Candidate[] => {
    const out: Candidate[] = [];
    const sel =
      'input, textarea, select, button, a[href], [role="button"], [role="textbox"], label';
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
        id: el.getAttribute('id'),
      });
    }
    return out.filter((c) => c.visible);
  });

  const htmlPath = resolve(OUT_DIR, `${target.id}-page-${stamp()}.html`);
  const screenshotPath = resolve(OUT_DIR, `${target.id}-screenshot-${stamp()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(htmlPath, await page.content(), 'utf8');

  const payload = {
    target: target.id,
    url: page.url(),
    capturedAt: new Date().toISOString(),
    candidateCount: candidates.length,
    candidates,
    htmlPath,
    screenshotPath,
  };

  const outPath = resolve(OUT_DIR, `${target.id}-dom-probe-${stamp()}.json`);
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  await browser.close({ reason: `${target.id} dom probe complete` });
  return outPath;
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const targets: Target[] = [
    {
      id: 'nc',
      cdp: process.env.NC_CDP ?? 'http://localhost:9223',
      urlPattern: /namecheap\.com/i,
      startUrl: 'https://ap.www.namecheap.com/settings/tools/apiaccess/',
    },
    {
      id: 'gd',
      cdp: process.env.GD_CDP ?? 'http://localhost:9224',
      urlPattern: /godaddy\.com/i,
      startUrl: 'https://developer.godaddy.com/keys',
    },
  ];

  await mkdir(OUT_DIR, { recursive: true });

  const results = await Promise.allSettled(targets.map((t) => probeTarget(t)));
  for (const [i, result] of results.entries()) {
    const id = targets[i]!.id;
    if (result.status === 'fulfilled') {
      console.log(`OK [${id}]: wrote probe to ${result.value}`);
    } else {
      console.error(`FAIL [${id}]:`, result.reason);
    }
  }

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
