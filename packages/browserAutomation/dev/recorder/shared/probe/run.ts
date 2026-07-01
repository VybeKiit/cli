import type { Page } from 'playwright';

import { classifyCrawlPages, missingFieldKeys } from './classify';
import { crawlHrefPages, LS_PRIORITY_PATH_RE } from './crawl';
import { emitProbeResults, printProbeSummary } from './emit';
import { expandModals } from './expand-modals';
import type { ProbeReport } from './types';
import { verifyEntryOnPage, verifyMatches } from './verify';

export type RunLsProbeOptions = {
  generatedPath: string;
  logDir: string;
  startUrl: string;
};

/** Orchestrate passive href crawl → classify → verify → emit. */
export async function runLsProbe(page: Page, options: RunLsProbeOptions): Promise<ProbeReport> {
  console.log(`[ls-probe] crawling from ${options.startUrl} (href navigation only, no clicks)…`);

  const crawl = await crawlHrefPages(page, options.startUrl);
  console.log(
    `[ls-probe] crawled ${crawl.visitedCount} page(s)${crawl.truncated ? ' (cap reached)' : ''}`,
  );

  const htmlByUrl: Record<string, string> = {};
  for (const snap of crawl.pages) {
    if (LS_PRIORITY_PATH_RE.test(snap.url)) {
      await page
        .goto(snap.url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        .catch(() => undefined);
      htmlByUrl[snap.url] = await page.content();
    }
  }

  const matched = classifyCrawlPages(crawl.pages, undefined, htmlByUrl);
  let missing = missingFieldKeys(matched);
  console.log(`[ls-probe] classified ${Object.keys(matched).length}/9 field keys (href crawl)`);

  const verifiedInline = new Set<string>();

  if (missing.length > 0) {
    console.log(`[ls-probe] expanding modals for: ${missing.join(', ')}`);
    const { modalPages, steps } = await expandModals(page, {
      onSnapshot: async (snap) => {
        const html = await page.content();
        const partial = classifyCrawlPages([snap], undefined, { [snap.url]: html });
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
    for (const step of steps) {
      console.log(`  modal ${step.id}: ${step.ok ? 'ok' : `skipped (${step.error})`}`);
    }
    crawl.pages.push(...modalPages);
    missing = missingFieldKeys(matched);
    console.log(`[ls-probe] after modals: ${Object.keys(matched).length}/9 field keys`);
  }

  const { verified: verifiedRest, verifyFailed } = await verifyMatches(page, matched);
  const verified = [...new Set([...verifiedInline, ...verifiedRest])];

  const report: ProbeReport = {
    capturedAt: new Date().toISOString(),
    crawl,
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

  return report;
}
