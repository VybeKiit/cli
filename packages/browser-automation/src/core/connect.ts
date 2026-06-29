import { type Browser, chromium } from 'playwright';

import { CdpUnreachableError } from './errors';
import { DEFAULT_CDP_ENDPOINT, type AttachedSession, type BaseVerbContext } from './types';

export type ConnectOptions = BaseVerbContext & { profileHint: string };

export async function connectToChrome(options: ConnectOptions): Promise<AttachedSession> {
  const endpoint = options.cdpEndpoint ?? DEFAULT_CDP_ENDPOINT;
  const log = options.log ?? console;

  log.log(`[automate] attaching to Chrome at ${endpoint}`);

  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP(endpoint, { timeout: 15_000 });
  } catch (err) {
    throw new CdpUnreachableError(endpoint, options.profileHint, err);
  }

  const context = browser.contexts()[0];
  if (!context) {
    await browser.close().catch(() => undefined);
    throw new CdpUnreachableError(
      endpoint,
      options.profileHint,
      new Error('Connected to Chrome but no browser context was found.'),
    );
  }

  const page = await context.newPage();
  const dispose = async (): Promise<void> => {
    try {
      await page.close({ runBeforeUnload: false });
    } catch {
      /* noop */
    }
    try {
      await browser.close({ reason: 'browser automation session complete' });
    } catch {
      /* noop */
    }
  };

  return { browser, context, dispose, page };
}
