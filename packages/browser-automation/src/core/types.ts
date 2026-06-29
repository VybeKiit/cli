import type { Browser, BrowserContext, Page } from 'playwright';

export type AttachedSession = {
  browser: Browser;
  context: BrowserContext;
  dispose: () => Promise<void>;
  page: Page;
};

export type BaseVerbContext = {
  cdpEndpoint?: string;
  log?: Pick<Console, 'error' | 'log' | 'warn'>;
};

export const DEFAULT_CDP_ENDPOINT = 'http://localhost:9222';

export const PROFILE_PATHS = {
  extension: `${process.env.HOME ?? '~'}/.cws-chrome-profile`,
  ls: `${process.env.HOME ?? '~'}/.ls-chrome-profile`,
} as const;

/** @deprecated Use PROFILE_PATHS.extension */
export const CWS_PROFILE_PATH = PROFILE_PATHS.extension;
