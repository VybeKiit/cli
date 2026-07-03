import { pacedClick, pacedFill } from '@vybekiit/browserAutomation/core/pace';
import { waitForGoogleAuthenticated } from '@vybekiit/browserAutomation/domains/google/dashboard/waitForAuthenticated';
import type { GoogleOAuthParams } from '@vybekiit/browserAutomation/domains/google/types';
import { consentUrl } from '@vybekiit/browserAutomation/domains/google/urls';
import type { BrowserContext, Locator, Page } from 'playwright';

/** First locator with a match, or null if none are present (blind-DOM fallback chain). */
async function firstPresent(locators: Locator[]): Promise<Locator | null> {
  for (const locator of locators) {
    if ((await locator.count()) > 0) return locator.first();
  }
  return null;
}

/** True when the consent screen ("Branding") is already configured — app name shown, no create form. */
async function isConsentAlreadyConfigured(page: Page): Promise<boolean> {
  const editControls = await firstPresent([
    page.getByRole('button', { name: /^edit(?:\s+app)?$/i }),
    page.getByRole('link', { name: /^edit(?:\s+app)?$/i }),
    page.getByText(/app registration|user type|publishing status/i),
  ]);
  const createControls = await firstPresent([
    page.getByRole('button', { name: /get started|create/i }),
  ]);
  return editControls !== null && createControls === null;
}

async function fillFieldByLabel(page: Page, label: RegExp, value: string): Promise<void> {
  const field = await firstPresent([
    page.getByLabel(label),
    page.getByRole('textbox', { name: label }),
  ]);
  if (field) await pacedFill(field, value);
}

/** Publish the consent screen to production so any Google user can sign in (no test-user gate). */
async function publishToProduction(page: Page, log: Pick<Console, 'log' | 'warn'>): Promise<void> {
  const publish = await firstPresent([
    page.getByRole('button', { name: /publish app|push to production|make external/i }),
  ]);
  if (!publish) {
    log.log('[google] consent screen already in production (no publish control)');
    return;
  }
  await pacedClick(publish);
  const confirm = await firstPresent([
    page.getByRole('button', { name: /^confirm$/i }),
    page.getByRole('button', { name: /publish|ok/i }),
  ]);
  if (confirm) await pacedClick(confirm);
  log.log('[google] consent screen published to production');
}

/**
 * Configure the OAuth consent screen: app name, support email, privacy/terms links, and
 * publish to production. Idempotent — if it's already configured, only ensures production.
 * Scopes (`openid email profile`) are the non-sensitive defaults, so no verification review.
 */
export async function configureConsent(
  page: Page,
  params: GoogleOAuthParams,
  context?: BrowserContext,
  log: Pick<Console, 'log' | 'warn'> = console,
): Promise<void> {
  await page.goto(consentUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  page = await waitForGoogleAuthenticated(page, log, context ?? page.context());

  const privacyUrl = params.privacyUrl ?? `${params.appUrl.replace(/\/$/, '')}/privacy`;
  const termsUrl = params.termsUrl ?? `${params.appUrl.replace(/\/$/, '')}/terms`;

  if (await isConsentAlreadyConfigured(page)) {
    log.log('[google] consent screen already configured — ensuring production status');
    await publishToProduction(page, log);
    return;
  }

  const start = await firstPresent([page.getByRole('button', { name: /get started|create/i })]);
  if (start) await pacedClick(start);

  await fillFieldByLabel(page, /app name/i, params.appName);
  await fillFieldByLabel(page, /user support email/i, params.supportEmail);

  // "External" user type — required for a personal account so any Google user can sign in.
  const external = await firstPresent([
    page.getByRole('radio', { name: /external/i }),
    page.getByLabel(/external/i),
  ]);
  if (external) await pacedClick(external);

  await fillFieldByLabel(
    page,
    /developer contact|contact information|email addresses/i,
    params.supportEmail,
  );
  await fillFieldByLabel(page, /privacy policy/i, privacyUrl);
  await fillFieldByLabel(page, /terms of service/i, termsUrl);

  // Advance through the multi-step wizard (Save/Continue/Next) until it settles.
  for (let step = 0; step < 5; step++) {
    const advance = await firstPresent([
      page.getByRole('button', { name: /save and continue|continue|next|create|save/i }),
    ]);
    if (!advance) break;
    await pacedClick(advance);
  }

  await publishToProduction(page, log);
  log.log('[google] consent screen configured');
}
