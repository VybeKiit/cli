import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { type Browser, chromium } from 'playwright';
import { CdpUnreachableError } from './errors';
import type { AttachedSession, VerbContext } from './types';

const DEFAULT_CDP_ENDPOINT = 'http://localhost:9222';

/**
 * Attach to the dedicated CWS Chrome over CDP and open a page that the
 * verb owns end-to-end.
 *
 * Why CDP attach instead of launching Playwright's own browser: see
 * ADR-0011. The CLI starts a persistent Chrome profile at
 * `$HOME/.cws-chrome-profile`, so Google sign-in survives across CWS
 * commands without sharing the operator's default Chrome profile.
 *
 * Why we reuse the existing context but only own the page we open: a
 * fresh `BrowserContext` over CDP would not inherit the dedicated profile's
 * Google session. So we use `browser.contexts()[0]` from the dedicated CWS
 * browser and open a new page inside it. The boundary the verb owns is the
 * page, not the browser profile.
 *
 * Disposal contract: callers MUST `await session.dispose()` even on error.
 * `dispose` closes the single page this function opened and closes the
 * Playwright CDP handle. For connected browsers, Playwright documents
 * `browser.close()` as disconnecting from the browser server.
 *
 * @param ctx - Extension verb context.
 * @returns Attached CWS browser session.
 * @example
 * const session = await connectToCwsChrome(ctx);
 */
export const connectToCwsChrome = async (ctx: VerbContext): Promise<AttachedSession> => {
  const endpoint = ctx.cdpEndpoint === undefined ? DEFAULT_CDP_ENDPOINT : ctx.cdpEndpoint;
  const log = resolveVerbLogger(ctx);

  log.log(`[cws] attaching to CWS Chrome at ${endpoint}`);

  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP(endpoint, { timeout: 15_000, noDefaults: true });
  } catch (err) {
    throw new CdpUnreachableError(endpoint, { cause: err });
  }

  const [context] = browser.contexts();
  if (context === undefined) {
    await browser.close().catch(() => undefined);
    throw new CdpUnreachableError(endpoint, {
      cause: new Error('Connected to Chrome but no existing browser context was found.'),
    });
  }

  const page = await context.newPage();

  const dispose = async (): Promise<void> => {
    try {
      await page.close({ runBeforeUnload: false });
    } catch {
      /* page may already be closed */
    }
    try {
      await browser.close({ reason: 'CWS automation session complete' });
    } catch {
      /* CDP connection may already be closed */
    }
  };

  return { browser, context, dispose, page };
};
