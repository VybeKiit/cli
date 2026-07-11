import type { BaseVerbContext } from '@vybekiit/browser-automation/core/types';

export type GoogleVerbContext = BaseVerbContext;

/** Google Cloud Console — signed-in home; used as the reuse-tab landing URL. */
export const GOOGLE_CONSOLE_URL = 'https://console.cloud.google.com';

/** Inputs for the one-shot OAuth setup (consent screen + Web client). */
export type GoogleOAuthParams = {
  /** GCP project ID the OAuth client is created under. */
  projectId: string;
  /** Consent-screen application name shown to end users. */
  appName: string;
  /** Developer/support contact email on the consent screen. */
  supportEmail: string;
  /** Public app base URL — the consent-screen "App home page"; privacy/terms default off it. */
  appUrl: string;
  /** Authorized redirect URIs registered on the Web client. */
  redirectUris: readonly string[];
  /**
   * Optional Authorized JavaScript origins. When omitted, origins are derived from
   * `redirectUris` (scheme + host + port) so localhost Auth.js logins work without extra flags.
   */
  jsOrigins?: readonly string[];
  /** Privacy policy URL (defaults to `${appUrl}/privacy`). */
  privacyUrl?: string;
  /** Terms of service URL (defaults to `${appUrl}/terms`). */
  termsUrl?: string;
  /** Local path to a square PNG/JPG/BMP ≤1MB (ideally 120×120) for the consent-screen logo. */
  logoPath?: string;
  /** OAuth scopes to register on the consent screen (defaults to `openid email profile`). */
  scopes?: readonly string[];
  /** Publish the app to Production (any Google user can sign in) instead of leaving it in Testing. */
  publish?: boolean;
  /**
   * Mint a fresh client secret on an existing client (secrets are view-once).
   * URI/origin patching does **not** rotate secrets unless this is set.
   */
  resetSecret?: boolean;
};

/**
 * Default non-sensitive identity scopes — sign-in only, no Google verification review required.
 * These are the fully-qualified scope identifiers the Data Access picker expects when pasted
 * (`email`/`profile` are the userinfo URLs; `openid` is bare).
 */
export const DEFAULT_OAUTH_SCOPES: readonly string[] = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/** Credentials / patch result after the Web OAuth client is created or updated. */
export type GoogleOAuthResult = {
  clientId: string;
  /**
   * Present when a secret was created or rotated (`--reset-secret` / first-time create).
   * Omitted on URI-only patches so agents do not churn dual secrets.
   */
  clientSecret?: string;
  projectId: string;
  /** True when an existing same-named client was patched rather than created fresh. */
  reusedExisting: boolean;
  /** Redirect URIs written to the form after merge. */
  redirectsApplied?: readonly string[];
  /** JavaScript origins written to the form after merge. */
  originsApplied?: readonly string[];
};

/** `.env` block Auth.js / Better Auth reads for the Google social provider. */
export type GoogleEnvBlock = {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET?: string;
};

/**
 * Map a setup result to the `.env` keys the buyer pastes in.
 *
 * Omits `GOOGLE_CLIENT_SECRET` when the run only patched URIs (no rotation).
 *
 * @param result - Operation result to convert.
 * @returns Env key map for `.env` / agent output.
 * @example
 * const env = googleEnvBlock(result);
 */
export const googleEnvBlock = (result: GoogleOAuthResult): GoogleEnvBlock => {
  const block: GoogleEnvBlock = {
    GOOGLE_CLIENT_ID: result.clientId,
  };
  if (result.clientSecret !== undefined && result.clientSecret.length > 0) {
    block.GOOGLE_CLIENT_SECRET = result.clientSecret;
  }
  return block;
};
