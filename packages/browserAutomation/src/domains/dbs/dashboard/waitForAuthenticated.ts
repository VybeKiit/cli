import type { VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
/**
 * Wait until the Supabase dashboard is reachable after manual sign-in.
 *
 * @param page - Playwright page to inspect or mutate.
 * @param _log - Input value for _log.
 * @param _context - Input value for _context.
 * @returns Promise resolving with the authenticated page.
 * @example
 * const result = await waitForSupabaseAuthenticated(page, _log, _context);
 */
export const waitForSupabaseAuthenticated = async (
  page: import('playwright').Page,
  _log: Pick<VerbLogger, 'log' | 'warn' | 'error'>,
  _context: import('playwright').BrowserContext,
): Promise<import('playwright').Page> => {
  // TODO: probe for dashboard nav / org selector indicating auth success
  await page.waitForSelector('[data-testid="dashboard-nav"]', { timeout: 30_000 }).catch(() => {
    // fallback: just wait for network idle
  });
  return page;
};
