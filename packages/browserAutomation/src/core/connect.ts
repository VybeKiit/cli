import { type Browser, chromium, type Page } from 'playwright';

import { CdpUnreachableError } from './errors';
import { type AttachedSession, type BaseVerbContext, DEFAULT_CDP_ENDPOINT } from './types';

export type ConnectOptions = BaseVerbContext & {
  readonly profileHint: string;
  /** Navigate here when opening a new tab (optional). */
  readonly startUrl?: string;
  /** Reuse an open tab whose URL matches this pattern (optional). */
  readonly tabUrlPattern?: RegExp;
};

/**
 * Remove one trailing slash from a URL-like string.
 *
 * @param value - URL or path value to normalize.
 * @returns The value without a final slash.
 * @example
 * const normalized = trimTrailingSlash('https://example.com/');
 */
const trimTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

/**
 * Find an open page whose URL matches the requested reuse pattern.
 *
 * @param pages - Candidate pages from the browser context.
 * @param tabUrlPattern - Optional URL pattern used to reuse an existing tab.
 * @returns The first matching open page, or undefined when no pattern/page matches.
 * @example
 * const page = findMatchingPage(context.pages(), /dashboard/);
 */
const findMatchingPage = (
  pages: readonly Page[],
  tabUrlPattern: RegExp | undefined,
): Page | undefined => {
  if (tabUrlPattern === undefined) {
    return;
  }

  return pages.filter((page) => !page.isClosed()).find((page) => tabUrlPattern.test(page.url()));
};

/**
 * Create the cleanup callback for an attached browser session.
 *
 * @param browser - Connected browser handle.
 * @param page - Current page owned by the session.
 * @param ownsPage - Whether the helper opened the page.
 * @returns A cleanup callback for the attached session.
 * @example
 * const dispose = createSessionDispose(browser, page, true);
 */
const createSessionDispose =
  (browser: Browser, page: Page, ownsPage: boolean) => async (): Promise<void> => {
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

/**
 * Attach Playwright to an existing dedicated Chrome session.
 *
 * @param options - CDP endpoint, profile hint, and optional tab reuse settings.
 * @returns The attached browser session and current page.
 * @example
 * const session = await connectToChrome({ profileHint: '/tmp/chrome', startUrl: 'https://example.com' });
 */
export const connectToChrome = async (options: ConnectOptions): Promise<AttachedSession> => {
  const endpoint = options.cdpEndpoint === undefined ? DEFAULT_CDP_ENDPOINT : options.cdpEndpoint;
  const log = options.log === undefined ? console : options.log;

  log.log(
    `[automate] attaching to Chrome at ${endpoint}\n` +
      `[automate] expected profile: ${options.profileHint} - sign in in that dedicated Chrome window, not your daily browser`,
  );

  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP(endpoint, { timeout: 15_000, noDefaults: true });
  } catch (err) {
    // biome-ignore lint/style/useErrorCause: CdpUnreachableError stores the cause through its ErrorOptions constructor.
    throw new CdpUnreachableError(endpoint, options.profileHint, { cause: err });
  }

  const [context] = browser.contexts();
  if (context === undefined) {
    await browser.close().catch(() => undefined);
    throw new CdpUnreachableError(
      endpoint,
      options.profileHint,
      new Error('Connected to Chrome but no browser context was found.'),
    );
  }

  const existing = findMatchingPage(context.pages(), options.tabUrlPattern);

  let page: Page;
  let ownsPage: boolean;

  if (existing === undefined) {
    page = await context.newPage();
    ownsPage = true;
    await page.bringToFront();
    if (options.startUrl !== undefined) {
      await page.goto(options.startUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    }
  } else {
    page = existing;
    ownsPage = false;
    await page.bringToFront();
    log.log(`[automate] reusing open tab: ${page.url()}`);
    if (options.startUrl !== undefined) {
      const target = trimTrailingSlash(options.startUrl);
      const current = trimTrailingSlash(page.url());
      if (current !== target && !current.startsWith(`${target}/`)) {
        await page.goto(options.startUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        log.log(`[automate] navigated reused tab -> ${page.url()}`);
      }
    }
  }

  const dispose = createSessionDispose(browser, page, ownsPage);

  return { browser, context, dispose, ownsPage, page };
};
