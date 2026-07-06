#!/usr/bin/env tsx
/**
 * Generic DOM probe for any provider dashboard — maintainer diagnostic only.
 *
 * This is the fallback tooling behind the "browser automation is last resort" policy:
 * when a provider has no headless CLI/API path to mint a token, we point this probe at
 * the live dashboard, sign in in the dedicated Chrome window, and dump every visible
 * candidate (role, aria-label, text, data-*, id/name) + full HTML + screenshot. Those
 * artifacts are how we write REAL selectors (never guessed) for the provider's
 * dashboard/createApiKey flow.
 *
 * Usage:
 *   PROVIDER_CDP=http://localhost:9222 \
 *   tsx dev/recorder/probeProviderDom.ts \
 *     --id=cloudflare \
 *     --url=https://dash.cloudflare.com/<accountId>/api-tokens \
 *     --match=dash\.cloudflare\.com
 *
 * Or drive it programmatically via {@link probeProvider}.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'logs');

export interface ProviderProbeTarget {
  /** Short slug used in output filenames (e.g. `cloudflare`, `supabase`). */
  id: string;
  /** CDP endpoint of the dedicated Chrome the builder signed into. */
  cdp: string;
  /** URL to open (or reuse a matching tab of). */
  startUrl: string;
  /** Reuse an already-open tab whose URL matches this pattern. */
  urlPattern: RegExp;
  /** Extra settle time after load, for SPA dashboards (default 2000ms). */
  settleMs?: number;
}

export interface ProbeCandidate {
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
  /** Serialized `data-*` attributes — Kumo/design-system anchors live here. */
  dataset: Record<string, string>;
}

export interface ProviderProbeResult {
  target: string;
  url: string;
  capturedAt: string;
  candidateCount: number;
  candidates: ProbeCandidate[];
  htmlPath: string;
  screenshotPath: string;
  jsonPath: string;
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/** Collect the visible interactive candidates from the current page DOM. */
async function collectCandidates(page: import('playwright').Page): Promise<ProbeCandidate[]> {
  return page.evaluate((): ProbeCandidate[] => {
    const out: ProbeCandidate[] = [];
    const sel =
      'input, textarea, select, button, a[href], [role="button"], [role="textbox"], [role="checkbox"], label';
    for (const el of Array.from(document.querySelectorAll(sel))) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const visible =
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        rect.width > 0 &&
        rect.height > 0;
      if (!visible) continue;
      const tag = el.tagName.toLowerCase();
      const dataset: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-')) dataset[attr.name] = attr.value;
      }
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
        dataset,
      });
    }
    return out;
  });
}

/** Probe one provider dashboard and write candidates + HTML + screenshot to logs/. */
export async function probeProvider(target: ProviderProbeTarget): Promise<ProviderProbeResult> {
  const browser = await chromium.connectOverCDP(target.cdp, { timeout: 15_000 });
  try {
    const context = browser.contexts()[0];
    if (!context) throw new Error(`No browser context on ${target.cdp}`);

    let page = context.pages().find((p) => target.urlPattern.test(p.url()));
    if (!page) {
      page = await context.newPage();
      await page.goto(target.startUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    }

    await page.waitForTimeout(target.settleMs ?? 2000);

    const candidates = await collectCandidates(page);

    await mkdir(OUT_DIR, { recursive: true });
    const at = stamp();
    const htmlPath = resolve(OUT_DIR, `${target.id}-page-${at}.html`);
    const screenshotPath = resolve(OUT_DIR, `${target.id}-screenshot-${at}.png`);
    const jsonPath = resolve(OUT_DIR, `${target.id}-dom-probe-${at}.json`);

    await page.screenshot({ path: screenshotPath, fullPage: true });
    await writeFile(htmlPath, await page.content(), 'utf8');

    const result: ProviderProbeResult = {
      target: target.id,
      url: page.url(),
      capturedAt: new Date().toISOString(),
      candidateCount: candidates.length,
      candidates,
      htmlPath,
      screenshotPath,
      jsonPath,
    };
    await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    return result;
  } finally {
    await browser.close({ reason: `${target.id} dom probe complete` });
  }
}

function parseArgs(argv: readonly string[]): ProviderProbeTarget | null {
  const get = (flag: string): string | undefined => {
    const hit = argv.find((a) => a.startsWith(`${flag}=`));
    return hit ? hit.slice(flag.length + 1) : undefined;
  };
  const id = get('--id');
  const startUrl = get('--url');
  const match = get('--match');
  if (!(id && startUrl)) return null;
  return {
    id,
    startUrl,
    cdp: process.env.PROVIDER_CDP ?? 'http://localhost:9222',
    urlPattern: new RegExp(match ?? id, 'i'),
  };
}

async function main(): Promise<void> {
  const target = parseArgs(process.argv.slice(2));
  if (!target) {
    console.error(
      'Usage: tsx dev/recorder/probeProviderDom.ts --id=<slug> --url=<dashboardUrl> [--match=<urlRegex>]',
    );
    process.exitCode = 1;
    return;
  }
  const result = await probeProvider(target);
  console.log(`OK [${result.target}]: ${result.candidateCount} candidates -> ${result.jsonPath}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
