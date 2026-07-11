import type { Browser, BrowserContext, Page } from 'playwright';
import type { VerbLogger } from './verbLogger';

export type AttachedSession = {
  readonly browser: Browser;
  readonly context: BrowserContext;
  readonly dispose: () => Promise<void>;
  /** When false, dispose leaves the tab open for the builder's session. */
  readonly ownsPage: boolean;
  /** Current Playwright page; login waiters may replace it with the authenticated tab. */
  page: Page;
};

export type BaseVerbContext = {
  readonly cdpEndpoint?: string;
  readonly log?: VerbLogger;
  /** Chrome user-data-dir override (`--profile=` or `--profile=last`). */
  readonly profilePath?: string;
};

export const DEFAULT_CDP_ENDPOINT = 'http://localhost:9222';

const HOME_DIR =
  process.env.HOME === undefined || process.env.HOME.length === 0 ? '~' : process.env.HOME;

export const PROFILE_PATHS = {
  cloudflare: `${HOME_DIR}/.cf-chrome-profile`,
  extension: `${HOME_DIR}/.cws-chrome-profile`,
  google: `${HOME_DIR}/.google-chrome-profile`,
  ls: `${HOME_DIR}/.ls-chrome-profile`,
  namecheap: `${HOME_DIR}/.nc-chrome-profile`,
  godaddy: `${HOME_DIR}/.gd-chrome-profile`,
  supabase: `${HOME_DIR}/.supabase-chrome-profile`,
} as const;
