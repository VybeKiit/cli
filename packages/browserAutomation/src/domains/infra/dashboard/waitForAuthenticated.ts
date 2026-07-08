import type { VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { scrapeCfAccountIdFromUrl } from './scrape';

/**
 * Wait until the Cloudflare dashboard is reachable after manual sign-in.
 *
 * @param page - Playwright page to inspect or mutate.
 * @param log - Input value for log.
 * @param _context - Input value for _context.
 * @returns Promise resolving with the authenticated page.
 * @example
 * const result = await waitForCfAuthenticated(page, log, _context);
 */
export const waitForCfAuthenticated = async (
  page: import('playwright').Page,
  log: Pick<VerbLogger, 'log' | 'warn' | 'error'>,
  _context: import('playwright').BrowserContext,
): Promise<import('playwright').Page> => {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    if (scrapeCfAccountIdFromUrl(page.url())) return page;

    const anchorVisible = await page
      .getByRole('navigation')
      .first()
      .isVisible()
      .catch(() => false);
    const accountLink = await page
      .getByRole('link', { name: /account home|websites|workers|overview/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (anchorVisible || accountLink) return page;

    log.log('[cf] waiting for Cloudflare sign-in (sign in in the dedicated Chrome window)…');
    await page.waitForTimeout(2000);
  }

  log.warn('[cf] timed out waiting for Cloudflare authentication.');
  return page;
};
