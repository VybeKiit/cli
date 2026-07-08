import type { VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import type { Browser, BrowserContext, Page } from 'playwright';

/**
 * What `connectToCwsChrome` returns. The caller is responsible for
 * calling `dispose()` to close the page the verb opened, even on error. The
 * underlying browser profile is the dedicated CWS Chrome profile from
 * ADR-0011; verbs own only their page and CDP handle.
 */
export type AttachedSession = {
  readonly browser: Browser;
  readonly context: BrowserContext;
  readonly dispose: () => Promise<void>;
  readonly page: Page;
};

/**
 * Per-extension configuration the verbs need to operate.
 *
 * Mirrors the extension slice produced by CLI discovery so the CLI layer can
 * pass one target through directly. Kept structurally compatible rather than
 * imported so this package has no knowledge of which extensions exist — it
 * just knows how to act on one.
 */
export type ExtensionConfig = {
  /**
   * The CWS-assigned Item ID. Empty string when the extension has not yet
   * been created on the dev console — `createNewItem` is the only verb that
   * accepts an empty string here; every other verb errors immediately.
   */
  readonly chromeWebStoreId: string;
  /**
   * Repo-relative path to the extension's workspace dir (e.g.
   * `extensions/wavey-audio-transcriber`). Used to locate `cws-listing.ts` and
   * resolve the pnpm filter target for the verify gate.
   */
  readonly dir: string;
  /**
   * Stable internal key (e.g. `wavey-audio-transcriber`). Used as the argument the
   * developer types: `pnpm cws update-listing wavey-audio-transcriber`.
   */
  readonly key: string;
  /**
   * Human-readable name shown in logs (e.g. `Audio Transcriber`).
   */
  readonly name: string;
  /** Optional package version surfaced from the CWS store file. */
  readonly version?: string;
};

/**
 * Context passed to every verb. Built once per CLI invocation by the wrapper
 * in `scripts/cli/`, then handed to the chosen verb. Verbs do not call
 * `process.cwd()` or read globals — every dependency is explicit here so the
 * verbs are testable and reusable from non-CLI callers.
 */
export type VerbContext = {
  /**
   * CDP endpoint the verb should attach to (e.g. `http://localhost:9222`).
   * Defaults to `http://localhost:9222` if not provided.
   */
  readonly cdpEndpoint?: string;
  /** Target extension. */
  readonly extension: ExtensionConfig;
  /**
   * Optional logger. Defaults to `console`. Verbs only ever log progress
   * lines — never secrets, never raw page contents.
   */
  readonly log?: Pick<VerbLogger, 'error' | 'log' | 'warn'>;
  /** Absolute path to the monorepo root. */
  readonly repoRoot: string;
};

export type { CwsListing } from './schema';
