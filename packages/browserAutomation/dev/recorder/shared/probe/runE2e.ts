import { LS_DRAFT_FIELDS } from '@vybekiit/browser-automation/domains/payments/ls/selectors/fields';
import { LS_PRODUCT_FIELD_HINTS } from '@vybekiit/browser-automation/domains/payments/ls/selectors/hints';
import type { Page } from 'playwright';
import { classifyCrawlPages, missingFieldKeys } from './classify';
import { cleanupAllE2eByPrefix, cleanupE2eArtifacts } from './e2eCleanup';
import { LS_E2E_PREFIX } from './e2eNames';
import { runE2eTouch } from './e2eTouch';
import { emitProbeResults, printProbeSummary } from './emit';
import type { ProbeReport } from './types';
import { verifyEntryOnPage, verifyMatch, verifyMatches } from './verify';

export type RunLsProbeE2eOptions = {
  cleanupAfter?: boolean;
  generatedPath: string;
  logDir: string;
  startUrl: string;
};

/** E2E probe: four pricing-type products + full editor on single-payment product. */
export async function runLsProbeE2e(
  page: Page,
  options: RunLsProbeE2eOptions,
): Promise<ProbeReport> {
  console.log('[ls-probe-e2e] creating four probe products and capturing selectors…');

  const matched: ProbeReport['matched'] = {};
  const verifiedInline = new Set<string>();
  const crawlPages: ProbeReport['crawl']['pages'] = [];

  const e2e = await runE2eTouch(page, options.logDir, {
    onSnapshot: async (snap) => {
      crawlPages.push(snap);
      const html = await page.content();
      const partial = classifyCrawlPages([snap], LS_PRODUCT_FIELD_HINTS, { [snap.url]: html });
      for (const [fieldKey, match] of Object.entries(partial)) {
        if (matched[fieldKey]) continue;
        const ok = await verifyEntryOnPage(page, match.entry);
        if (ok) {
          matched[fieldKey] = match;
          verifiedInline.add(fieldKey);
        }
      }
    },
  });

  for (const match of e2e.manualMatches) {
    if (matched[match.fieldKey]) continue;
    matched[match.fieldKey] = match;
    verifiedInline.add(match.fieldKey);
  }

  for (const step of e2e.steps) {
    console.log(`  e2e ${step.id}: ${step.ok ? 'ok' : `failed (${step.error})`}`);
  }

  const missing = missingFieldKeys(matched);
  console.log(
    `[ls-probe-e2e] classified ${Object.keys(matched).length}/${LS_DRAFT_FIELDS.length} field keys`,
  );

  const { verified: verifiedRest, verifyFailed } = await verifyMatches(page, matched);
  const verified = [...new Set([...verifiedInline, ...verifiedRest])];

  const report: ProbeReport = {
    capturedAt: new Date().toISOString(),
    crawl: {
      pages: crawlPages,
      visitedCount: crawlPages.length,
      truncated: false,
    },
    matched,
    missing,
    verified,
    verifyFailed,
  };

  const { writtenCount, logPath } = await emitProbeResults({
    generatedPath: options.generatedPath,
    logDir: options.logDir,
    matched,
    report,
    verifiedKeys: verified,
  });

  printProbeSummary(report, writtenCount);
  console.log(`Probe log: ${logPath}`);
  console.log(`E2E artifacts: ${e2e.artifactsPath}`);
  console.log('Cleanup: pnpm --filter @vybekiit/browser-automation recorder:ls probe-e2e cleanup');

  if (options.cleanupAfter) {
    const remaining = e2e.artifacts.productNames.filter(
      (n) => !e2e.artifacts.deletedProductNames.includes(n),
    );
    if (remaining.length === 0) {
      console.log('[ls-probe-e2e] all probe products deleted during CRUD flow');
    } else {
      await cleanupE2eArtifacts(page, e2e.artifacts);
      console.log('[ls-probe-e2e] cleaned up remaining probe products');
    }
  }

  return report;
}

export async function runLsProbeE2eCleanup(page: Page): Promise<void> {
  console.log(`[ls-probe-e2e] deleting all resources matching ${LS_E2E_PREFIX}…`);
  await cleanupAllE2eByPrefix(page);
  console.log('[ls-probe-e2e] cleanup complete');
}

export { LS_E2E_PREFIX } from './e2eNames';
