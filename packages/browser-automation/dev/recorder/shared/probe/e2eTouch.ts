import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { Page } from 'playwright';

import { runFourProductProbe } from './e2eProductFlow';
import { createE2eArtifacts, LS_E2E_PREFIX } from './e2eNames';
import { snapshotPage } from './snapshot';
import type { ClassifiedMatch, PageSnapshot } from './types';

const ORIGIN = 'https://app.lemonsqueezy.com';

export type E2eTouchHooks = {
  onSnapshot?: (snap: PageSnapshot, step: string) => Promise<void>;
};

export type E2eTouchResult = {
  artifacts: ReturnType<typeof createE2eArtifacts>;
  artifactsPath: string;
  manualMatches: ClassifiedMatch[];
  pages: PageSnapshot[];
  steps: { id: string; ok: boolean; error?: string }[];
};

async function scrapeStoresPage(page: Page, hooks: E2eTouchHooks, pages: PageSnapshot[]): Promise<void> {
  await page.goto(`${ORIGIN}/settings/stores`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(500);
  const snap = await snapshotPage(page);
  pages.push(snap);
  await hooks.onSnapshot?.(snap, 'stores-settings');
}

/** Browser E2E probe: four pricing-type products + full editor on single-payment product. */
export async function runE2eTouch(
  page: Page,
  logDir: string,
  hooks: E2eTouchHooks = {},
): Promise<E2eTouchResult> {
  const artifacts = createE2eArtifacts();
  const pages: PageSnapshot[] = [];
  const manualMatches: ClassifiedMatch[] = [];
  const steps: E2eTouchResult['steps'] = [];

  const runStep = async (
    id: string,
    fn: () => Promise<void | ClassifiedMatch[]>,
  ): Promise<void> => {
    try {
      const result = await fn();
      if (Array.isArray(result)) manualMatches.push(...result);
      steps.push({ id, ok: true });
    } catch (err) {
      steps.push({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  };

  console.log(`[ls-probe-e2e] runId=${artifacts.runId}`);
  console.log('  CRUD order per product: create → update → read → delete');
  console.log('  products: single (full editor), subscription, lead, pwyw');
  console.log('  (API key + webhook → LS REST API in ls setup, not browser probe)');

  await runStep('create-four-products', () => runFourProductProbe(page, artifacts, hooks, pages));
  await runStep('scrape-stores', () => scrapeStoresPage(page, hooks, pages));

  await mkdir(logDir, { recursive: true });
  const artifactsPath = resolve(logDir, `ls-e2e-artifacts-${artifacts.runId}.json`);
  await writeFile(artifactsPath, `${JSON.stringify(artifacts, null, 2)}\n`, 'utf8');
  console.log(`[ls-probe-e2e] artifacts saved: ${artifactsPath}`);

  return { artifacts, artifactsPath, manualMatches, pages, steps };
}

export { LS_E2E_PREFIX };
