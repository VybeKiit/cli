import { resolveVerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { connectToGoogleChrome } from '@vybekiit/browser-automation/domains/google/connect';
import { waitForGoogleAuthenticated } from '@vybekiit/browser-automation/domains/google/dashboard/waitForAuthenticated';
import { ensureProject } from '@vybekiit/browser-automation/domains/google/ensureProject';
import {
  isValidClientId,
  validateGoogleCredentials,
} from '@vybekiit/browser-automation/domains/google/scrape';
import type {
  GoogleOAuthParams,
  GoogleOAuthResult,
  GoogleVerbContext,
} from '@vybekiit/browser-automation/domains/google/types';
import { configureConsent } from './configureConsent';
import { createOAuthClient } from './createOAuthClient';

/**
 * Wait until the builder reaches the Cloud Console after manual Google sign-in.
 *
 * @param ctx - Shared verb context for automation side effects.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await standbyGoogleLogin(ctx);
 */
export const standbyGoogleLogin = async (
  ctx: GoogleVerbContext = {},
): Promise<{ ready: boolean; url?: string }> => {
  const session = await connectToGoogleChrome(ctx, { waitForAuth: false });
  try {
    try {
      session.page = await waitForGoogleAuthenticated(
        session.page,
        resolveVerbLogger(ctx),
        session.context,
      );
      return { ready: true, url: session.page.url() };
    } catch {
      return { ready: false };
    }
  } finally {
    await session.dispose();
  }
};

/**
 * One-shot Google OAuth setup: ensure the GCP project (gcloud), then drive the Console once to
 * configure the consent screen and create/patch the Web OAuth client.
 *
 * Re-runs with the same `--app-name` **patch** redirects + JS origins in place (fixes
 * `redirect_uri_mismatch` without minting another secret unless `--reset-secret`).
 *
 * @param ctx - Shared verb context for automation side effects.
 * @param params - Validated automation parameters for the operation.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await runGoogleOAuthSetup(ctx, params);
 */
export const runGoogleOAuthSetup = async (
  ctx: GoogleVerbContext,
  params: GoogleOAuthParams,
): Promise<GoogleOAuthResult> => {
  const log = resolveVerbLogger(ctx);
  await ensureProject(params.projectId, log);

  const session = await connectToGoogleChrome(ctx, { waitForAuth: true });
  try {
    await configureConsent(session.page, params, session.context, log);
    const result = await createOAuthClient(session.page, params, session.context, log);
    if (!isValidClientId(result.clientId)) {
      throw new Error(
        'Read a client id from the Console but it is not a well-formed Google OAuth client ID. Re-run, or copy it manually into .env.',
      );
    }
    if (
      result.clientSecret !== undefined &&
      !validateGoogleCredentials(result.clientId, result.clientSecret)
    ) {
      throw new Error(
        'Read credentials from the Console but they are not well-formed Google OAuth values. Re-run, or copy them manually into .env.',
      );
    }
    return result;
  } finally {
    await session.dispose();
  }
};
