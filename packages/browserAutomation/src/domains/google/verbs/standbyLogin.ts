import { connectToGoogleChrome } from '@vybekiit/browserAutomation/domains/google/connect';
import { waitForGoogleAuthenticated } from '@vybekiit/browserAutomation/domains/google/dashboard/waitForAuthenticated';
import { ensureProject } from '@vybekiit/browserAutomation/domains/google/ensureProject';
import { validateGoogleCredentials } from '@vybekiit/browserAutomation/domains/google/scrape';
import type {
  GoogleOAuthParams,
  GoogleOAuthResult,
  GoogleVerbContext,
} from '@vybekiit/browserAutomation/domains/google/types';
import { configureConsent } from './configureConsent';
import { createOAuthClient } from './createOAuthClient';

/** Wait until the builder reaches the Cloud Console after manual Google sign-in. */
export async function standbyLogin(
  ctx: GoogleVerbContext = {},
): Promise<{ ready: boolean; url?: string }> {
  const session = await connectToGoogleChrome(ctx, { waitForAuth: false });
  try {
    try {
      session.page = await waitForGoogleAuthenticated(
        session.page,
        ctx.log ?? console,
        session.context,
      );
      return { ready: true, url: session.page.url() };
    } catch {
      return { ready: false };
    }
  } finally {
    await session.dispose();
  }
}

/**
 * One-shot Google OAuth setup: ensure the GCP project (gcloud), then drive the Console once
 * to configure the consent screen and create/reset the Web OAuth client, returning credentials.
 */
export async function runGoogleOAuthSetup(
  ctx: GoogleVerbContext,
  params: GoogleOAuthParams,
): Promise<GoogleOAuthResult> {
  const log = ctx.log ?? console;
  await ensureProject(params.projectId, log);

  const session = await connectToGoogleChrome(ctx, { waitForAuth: true });
  try {
    await configureConsent(session.page, params, session.context, log);
    const result = await createOAuthClient(session.page, params, session.context, log);
    if (!validateGoogleCredentials(result.clientId, result.clientSecret)) {
      throw new Error(
        'Read credentials from the Console but they are not well-formed Google OAuth values. Re-run, or copy them manually into .env.',
      );
    }
    return result;
  } finally {
    await session.dispose();
  }
}
