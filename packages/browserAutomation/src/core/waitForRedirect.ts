import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import type { BrowserContext, Page } from 'playwright';

const DEFAULT_AUTH_TIMEOUT_MS = 600_000;
const GLOBAL_AUTH_TIMEOUT_ENV = 'AUTOMATE_AUTH_TIMEOUT_MS';

export type WaitForRedirectConfig = {
  /** e.g. `[nc]` - prefixed to status logs */
  readonly logPrefix: string;
  /** Shown once while waiting for the builder to finish sign-in */
  readonly prompt: string;
  /** Domain-specific URL check (handles auth-gate exclusions) */
  readonly isAuthenticated: (url: string) => boolean;
  /** Optional DOM probe - signed-in app surface without login controls */
  readonly isAuthenticatedDom?: (page: Page) => Promise<boolean>;
  /** Per-domain override, e.g. `NC_AUTH_TIMEOUT_MS` */
  readonly timeoutEnvVar?: string;
};

/**
 * Resolve the sign-in timeout from domain or global environment variables.
 *
 * @param domainEnvVar - Optional domain-specific timeout env key.
 * @returns Positive timeout in milliseconds.
 * @example
 * const timeoutMs = resolveAuthTimeoutMs('NC_AUTH_TIMEOUT_MS');
 */
const resolveAuthTimeoutMs = (domainEnvVar?: string): number => {
  for (const key of [domainEnvVar, GLOBAL_AUTH_TIMEOUT_ENV]) {
    if (key !== undefined && key.length > 0) {
      const raw = process.env[key];
      if (raw !== undefined && raw.length > 0) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  }
  return DEFAULT_AUTH_TIMEOUT_MS;
};

/**
 * Check whether a URL belongs to Chrome internals instead of the target dashboard.
 *
 * @param url - Candidate page URL.
 * @returns True for Chrome internal pages that automation should skip.
 * @example
 * const skip = isInternalBrowserUrl('chrome://extensions');
 */
const isInternalBrowserUrl = (url: string): boolean =>
  url.startsWith('chrome://') || url.startsWith('chrome-extension://');

/**
 * Confirm that a page is authenticated via DOM probe or URL predicate.
 *
 * @param page - Candidate Playwright page.
 * @param config - Authentication predicates for the target dashboard.
 * @returns True when the page appears authenticated.
 * @example
 * const ready = await confirmAuthenticatedPage(page, config);
 */
const confirmAuthenticatedPage = async (
  page: Page,
  config: WaitForRedirectConfig,
): Promise<boolean> => {
  await page.waitForTimeout(750);
  if (config.isAuthenticatedDom !== undefined && (await config.isAuthenticatedDom(page))) {
    return true;
  }
  return config.isAuthenticated(page.url());
};

/**
 * Find an authenticated dashboard tab in a browser context.
 *
 * @param context - Browser context to scan.
 * @param config - Authentication predicates for the target dashboard.
 * @returns The first authenticated page, or null when none are ready.
 * @example
 * const page = await findReadyPage(context, config);
 */
const findReadyPage = async (
  context: BrowserContext,
  config: WaitForRedirectConfig,
): Promise<Page | null> => {
  for (const candidate of context.pages()) {
    if (!(candidate.isClosed() || isInternalBrowserUrl(candidate.url()))) {
      // biome-ignore lint/performance/noAwaitInLoops: dashboard DOM probes must run in tab order.
      const authenticated = await confirmAuthenticatedPage(candidate, config);
      if (authenticated) {
        return candidate;
      }
    }
  }
  return null;
};

/**
 * Block until the builder finishes sign-in and any tab in the profile reaches
 * an authenticated app URL. Returns the page to drive (may differ from `page`
 * when the builder completes login in another tab).
 *
 * @param page - Initial page to monitor.
 * @param context - Browser context containing candidate tabs.
 * @param config - Authentication predicates and timeout settings.
 * @param log - Logger for status output.
 * @returns The authenticated page automation should drive next.
 * @example
 * const readyPage = await waitForRedirectAfterSignIn(page, context, config, console);
 */
export const waitForRedirectAfterSignIn = async (
  page: Page,
  context: BrowserContext,
  config: WaitForRedirectConfig,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
): Promise<Page> => {
  const timeoutMs = resolveAuthTimeoutMs(config.timeoutEnvVar);
  const deadline = Date.now() + timeoutMs;
  let announcedWait = false;

  while (Date.now() < deadline) {
    // biome-ignore lint/performance/noAwaitInLoops: sign-in waiting is an intentional polling loop.
    const ready = await findReadyPage(context, config);
    if (ready) {
      if (announcedWait) {
        log.log(`${config.logPrefix} sign-in complete - continuing automation`);
      } else {
        log.log(`${config.logPrefix} session active - continuing automation`);
      }
      if (ready !== page) {
        await ready.bringToFront();
      }
      return ready;
    }

    if (!announcedWait) {
      log.log(`${config.logPrefix} ${config.prompt}`);
      announcedWait = true;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      break;
    }

    const slice = Math.min(remaining, 5000);
    try {
      await page.waitForURL((url) => config.isAuthenticated(url.href), { timeout: slice });
      if (await confirmAuthenticatedPage(page, config)) {
        log.log(
          `${config.logPrefix} ${announcedWait ? 'sign-in complete' : 'session active'} - continuing automation`,
        );
        return page;
      }
    } catch {
      await page.waitForTimeout(Math.min(slice, 1000));
    }
  }

  throw new Error(
    `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for sign-in. ` +
      'Complete login in the browser window - automation resumes automatically on redirect.',
  );
};
