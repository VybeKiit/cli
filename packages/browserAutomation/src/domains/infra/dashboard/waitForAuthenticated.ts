import { scrapeCfAccountIdFromUrl } from './scrape';

/**
 * Wait until the Cloudflare dashboard is reachable after manual sign-in.
 *
 * Signed-in state is confirmed primarily by the 32-hex account id appearing in the URL
 * (the dashboard redirects to `/<accountId>/...` once authenticated); a couple of visible
 * dashboard anchors are used as secondary/fallback signals so a URL scheme change alone
 * doesn't wedge the flow.
 */
export async function waitForCfAuthenticated(
  page: import('playwright').Page,
  log: Pick<Console, 'log' | 'warn' | 'error'>,
  _context: import('playwright').BrowserContext,
): Promise<import('playwright').Page> {
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
}
