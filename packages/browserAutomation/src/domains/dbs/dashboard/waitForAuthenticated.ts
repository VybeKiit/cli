/**
 * Wait until the Supabase dashboard is reachable after manual sign-in.
 *
 * Stub — implement with actual DOM probes when Supabase automation is prioritized.
 */
export async function waitForSupabaseAuthenticated(
  page: import('playwright').Page,
  _log: Pick<Console, 'log' | 'warn' | 'error'>,
  _context: import('playwright').BrowserContext,
): Promise<import('playwright').Page> {
  // TODO: probe for dashboard nav / org selector indicating auth success
  await page.waitForSelector('[data-testid="dashboard-nav"]', { timeout: 30_000 }).catch(() => {
    // fallback: just wait for network idle
  });
  return page;
}
