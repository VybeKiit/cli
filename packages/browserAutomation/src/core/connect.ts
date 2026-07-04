import { type Browser, chromium, type Page } from 'playwright';

import { CdpUnreachableError } from './errors';
import { type AttachedSession, type BaseVerbContext, DEFAULT_CDP_ENDPOINT } from './types';

export type ConnectOptions = BaseVerbContext & {
  profileHint: string;
  /** Navigate here when opening a new tab (optional). */
  startUrl?: string;
  /** Reuse an open tab whose URL matches this pattern (optional). */
  tabUrlPattern?: RegExp;
};

export async function connectToChrome(options: ConnectOptions): Promise<AttachedSession> {
  const endpoint = options.cdpEndpoint ?? DEFAULT_CDP_ENDPOINT;
  const log = options.log ?? console;

  log.log(
    `[automate] attaching to Chrome at ${endpoint}\n` +
      `[automate] expected profile: ${options.profileHint} — sign in in that dedicated Chrome window, not your daily browser`,
  );

  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP(endpoint, { timeout: 15_000, noDefaults: true });
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

  const existing =
    options.tabUrlPattern &&
    context
      .pages()
      .filter((p) => !p.isClosed())
      .find((p) => options.tabUrlPattern!.test(p.url()));

  let page: Page;
  let ownsPage: boolean;

  if (existing) {
    page = existing;
    ownsPage = false;
    await page.bringToFront();
    log.log(`[automate] reusing open tab: ${page.url()}`);
    if (options.startUrl) {
      const target = options.startUrl.replace(/\/$/, '');
      const current = page.url().replace(/\/$/, '');
      if (current !== target && !current.startsWith(`${target}/`)) {
        await page.goto(options.startUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        log.log(`[automate] navigated reused tab → ${page.url()}`);
      }
    }
  } else {
    page = await context.newPage();
    ownsPage = true;
    await page.bringToFront();
    if (options.startUrl) {
      await page.goto(options.startUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    }
  }

  const dispose = async (): Promise<void> => {
    if (ownsPage) {
      try {
        await page.close({ runBeforeUnload: false });
      } catch {
        /* noop */
      }
    }
    try {
      await browser.close({ reason: 'browser automation session complete' });
    } catch {
      /* noop */
    }
  };

  return { browser, context, dispose, ownsPage, page };
}
