import type { BaseVerbContext } from '@vybekiit/browserAutomation/core/types';

export type GoogleVerbContext = BaseVerbContext;

/** Google Cloud Console — signed-in home; used as the reuse-tab landing URL. */
export const GOOGLE_CONSOLE_URL = 'https://console.cloud.google.com';

/** Inputs for the one-shot OAuth setup (consent screen + Web client). */
export interface GoogleOAuthParams {
  /** GCP project ID the OAuth client is created under. */
  projectId: string;
  /** Consent-screen application name shown to end users. */
  appName: string;
  /** Developer/support contact email on the consent screen. */
  supportEmail: string;
  /** Public app base URL — privacy/terms default to `${appUrl}/privacy` and `/terms`. */
  appUrl: string;
  /** Authorized redirect URIs registered on the Web client. */
  redirectUris: readonly string[];
  /** Privacy policy URL (defaults to `${appUrl}/privacy`). */
  privacyUrl?: string;
  /** Terms of service URL (defaults to `${appUrl}/terms`). */
  termsUrl?: string;
  /** Reset the secret on a same-named existing client instead of failing. */
  resetSecret?: boolean;
}

/** Credentials read back after the Web OAuth client is created or its secret reset. */
export interface GoogleOAuthResult {
  clientId: string;
  clientSecret: string;
  projectId: string;
  /** True when an existing client was reused (secret reset) rather than created fresh. */
  reusedExisting: boolean;
}

/** `.env` block Better Auth reads for the Google social provider. */
export interface GoogleEnvBlock {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

/** Map a setup result to the `.env` keys the buyer pastes in. */
export function googleEnvBlock(result: GoogleOAuthResult): GoogleEnvBlock {
  return {
    GOOGLE_CLIENT_ID: result.clientId,
    GOOGLE_CLIENT_SECRET: result.clientSecret,
  };
}
