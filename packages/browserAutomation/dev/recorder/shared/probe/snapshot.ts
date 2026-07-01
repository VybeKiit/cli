import type { Page } from 'playwright';

import { extractPageSnapshot } from './snapshot.evaluate.js';
import type { DomCandidate, PageSnapshot } from './types';

type RawCandidate = DomCandidate & { visible: boolean };

/** Extract visible interactive candidates and in-app hrefs from the current page. */
export async function snapshotPage(page: Page): Promise<PageSnapshot> {
  const url = page.url();
  const pathname = new URL(url).pathname;

  const { candidates, hrefs } = await page.evaluate(extractPageSnapshot);

  return {
    url,
    pathname,
    candidates: (candidates as RawCandidate[]).map(({ visible: _v, ...rest }) => rest),
    hrefs,
  };
}

/** Collect same-origin hrefs from a page (used by crawl tests). */
export async function collectHrefsFromPage(page: Page): Promise<string[]> {
  return (await snapshotPage(page)).hrefs;
}
