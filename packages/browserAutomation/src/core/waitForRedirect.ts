import type { BrowserContext, Page } from 'playwright';

const DEFAULT_AUTH_TIMEOUT_MS = 600_000;
const GLOBAL_AUTH_TIMEOUT_ENV = 'AUTOMATE_AUTH_TIMEOUT_MS';

export type WaitForRedirectConfig = {
  /** e.g. `[nc]` — prefixed to status logs */
  logPrefix: string;
  /** Shown once while waiting for the builder to finish sign-in */
  prompt: string;
  /** Domain-specific URL check (handles auth-gate exclusions) */
  isAuthenticated: (url: string) => boolean;
  /** Optional DOM probe — signed-in app surface without login controls */
  isAuthenticatedDom?: (page: Page) => Promise<boolean>;
  /** Per-domain override, e.g. `NC_AUTH_TIMEOUT_MS` */
  timeoutEnvVar?: string;
};

function resolveAuthTimeoutMs(domainEnvVar?: string): number {
  for (const key of [domainEnvVar, GLOBAL_AUTH_TIMEOUT_ENV]) {
    if (!key) continue;
    const raw = process.env[key];
    if (!raw) continue;
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_AUTH_TIMEOUT_MS;
}

async function confirmAuthenticatedPage(
  page: Page,
  config: WaitForRedirectConfig,
): Promise<boolean> {
  await page.waitForTimeout(750);
  if (config.isAuthenticatedDom && (await config.isAuthenticatedDom(page))) return true;
  return config.isAuthenticated(page.url());
}

async function findReadyPage(
  context: BrowserContext,
  config: WaitForRedirectConfig,
): Promise<Page | null> {
  for (const candidate of context.pages()) {
    if (candidate.isClosed?.()) continue;
    const url = candidate.url();
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) continue;
    if (await confirmAuthenticatedPage(candidate, config)) return candidate;
  }
  return null;
}

/**
 * Block until the builder finishes sign-in and any tab in the profile reaches
 * an authenticated app URL. Returns the page to drive (may differ from `page`
 * when the builder completes login in another tab).
 */
export async function waitForRedirectAfterSignIn(
  page: Page,
  context: BrowserContext,
  config: WaitForRedirectConfig,
  log: Pick<Console, 'log' | 'warn'> = console,
): Promise<Page> {
  const timeoutMs = resolveAuthTimeoutMs(config.timeoutEnvVar);
  const deadline = Date.now() + timeoutMs;
  let announcedWait = false;

  while (Date.now() < deadline) {
    const ready = await findReadyPage(context, config);
    if (ready) {
      if (announcedWait) {
        log.log(`${config.logPrefix} sign-in complete — continuing automation`);
      } else {
        log.log(`${config.logPrefix} session active — continuing automation`);
      }
      if (ready !== page) await ready.bringToFront();
      return ready;
    }

    if (!announcedWait) {
      log.log(`${config.logPrefix} ${config.prompt}`);
      announcedWait = true;
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;

    const slice = Math.min(remaining, 5000);
    try {
      await page.waitForURL((url) => config.isAuthenticated(url.href), { timeout: slice });
      if (await confirmAuthenticatedPage(page, config)) {
        log.log(
          `${config.logPrefix} ${announcedWait ? 'sign-in complete' : 'session active'} — continuing automation`,
        );
        return page;
      }
    } catch {
      await page.waitForTimeout(Math.min(slice, 1000));
    }
  }

  throw new Error(
    `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for sign-in. ` +
      'Complete login in the browser window — automation resumes automatically on redirect.',
  );
}
