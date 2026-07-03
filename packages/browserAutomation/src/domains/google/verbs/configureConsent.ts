import {
  pacedDispatchClick,
  pacedFill,
  resolvePaceMs,
} from '@vybekiit/browserAutomation/core/pace';
import { waitForGoogleAuthenticated } from '@vybekiit/browserAutomation/domains/google/dashboard/waitForAuthenticated';
import {
  DEFAULT_OAUTH_SCOPES,
  type GoogleOAuthParams,
} from '@vybekiit/browserAutomation/domains/google/types';
import {
  audienceUrl,
  consentCreateUrl,
  consentUrl,
  dataAccessUrl,
} from '@vybekiit/browserAutomation/domains/google/urls';
import type { BrowserContext, Locator, Page } from 'playwright';

/** Resolve the consent-screen home/privacy/terms links, defaulting privacy/terms off the app URL. */
function resolveAppDomain(params: GoogleOAuthParams): {
  homepage: string;
  privacy: string;
  terms: string;
} {
  const base = params.appUrl.replace(/\/$/, '');
  return {
    homepage: params.appUrl,
    privacy: params.privacyUrl ?? `${base}/privacy`,
    terms: params.termsUrl ?? `${base}/terms`,
  };
}

/** First locator with a match, or null if none are present (blind-DOM fallback chain). */
async function firstPresent(locators: Locator[]): Promise<Locator | null> {
  for (const locator of locators) {
    if ((await locator.count()) > 0) return locator.first();
  }
  return null;
}

/**
 * True when the "Google Auth Platform" is already configured for this project.
 *
 * On the branding page an unconfigured project shows a "Get started" call to action; a
 * configured one shows the editable app-name field (and a "Publishing status" section) instead.
 * The Console renders this slowly, so we give a configured signal up to ~8s to appear before
 * concluding the project is unconfigured — otherwise a slow render is misread as first-run and
 * the wizard is wrongly re-entered.
 */
async function isConsentAlreadyConfigured(page: Page): Promise<boolean> {
  const signal = page
    .locator('input[formcontrolname="displayName"]')
    .or(page.getByText(/publishing status/i));
  try {
    await signal.first().waitFor({ state: 'attached', timeout: 8000 });
    return true;
  } catch {
    return false;
  }
}

/** Pick a value from a `cfc-select` combobox by its visible option text. */
async function selectOption(page: Page, control: Locator, optionText: string): Promise<boolean> {
  if ((await control.count()) === 0) return false;
  await pacedDispatchClick(control.first());
  const option = page.getByRole('option', { name: optionText, exact: true });
  if ((await option.count()) === 0) return false;
  await pacedDispatchClick(option.first());
  return true;
}

/** Advance the create wizard one step (Next/Create), returning false when no control remains. */
async function advanceWizard(page: Page): Promise<boolean> {
  const advance = await firstPresent([
    page.getByRole('button', { name: /^next$/i }),
    page.getByRole('button', { name: /^create$/i }),
  ]);
  if (!advance) return false;
  await pacedDispatchClick(advance);
  await page.waitForTimeout(resolvePaceMs());
  return true;
}

/**
 * Configure the OAuth consent screen on the redesigned Google Auth Platform, end to end, so a
 * builder gets a working "Sign in with Google" in one shot. Idempotent on the branding basics:
 * if the app already exists it skips the first-run wizard and only (re)applies logo/domain. It
 * always then registers scopes, sets the app-domain links, uploads the logo, and — when
 * `params.publish` — moves the app from Testing to Production.
 *
 * The Console floats an overlay that eats real pointer clicks, so every click goes through
 * `pacedDispatchClick` (a dispatched DOM event) while text/file inputs use fill/setInputFiles.
 * The default scopes (`openid email profile`) are non-sensitive, so Production needs no review;
 * the one thing that can trigger Google review is brand verification of an uploaded logo.
 */
export async function configureConsent(
  page: Page,
  params: GoogleOAuthParams,
  context?: BrowserContext,
  log: Pick<Console, 'log' | 'warn'> = console,
): Promise<void> {
  await page.goto(consentUrl(params.projectId), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  page = await waitForGoogleAuthenticated(page, log, context ?? page.context());

  if (await isConsentAlreadyConfigured(page)) {
    log.log('[google] consent screen already configured — updating branding/scopes');
  } else {
    await runFirstRunWizard(page, params, log);
  }

  await setAppDomain(page, params, log);
  if (params.logoPath) await uploadLogoForProject(page, params, log);
  await registerScopes(page, params, log);
  if (params.publish) await publishApp(page, params, log);
}

/** Drive the first-run consent wizard: App Information → Audience → Contact → Finish. */
async function runFirstRunWizard(
  page: Page,
  params: GoogleOAuthParams,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<void> {
  await page.goto(consentCreateUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await page.waitForTimeout(resolvePaceMs());

  // Step 1 — App Information: app name + a support email chosen from the account's own addresses.
  const nameField = page.locator('input[formcontrolname="displayName"]').first();
  await pacedFill(nameField, params.appName);
  const supportPicked = await selectOption(
    page,
    page.locator('[formcontrolname="userSupportEmail"]'),
    params.supportEmail,
  );
  if (!supportPicked) {
    throw new Error(
      `Support email "${params.supportEmail}" was not selectable — it must be the signed-in Google account or a group it owns. Pick one of the offered addresses and retry.`,
    );
  }
  await advanceWizard(page);

  // Step 2 — Audience: External so any Google user can sign in (required for a personal account).
  const external = await firstPresent([
    page.getByRole('radio', { name: /external/i }),
    page.locator('mat-radio-button').filter({ hasText: /external/i }),
  ]);
  if (external) await pacedDispatchClick(external);
  await advanceWizard(page);

  // Step 3 — Contact Information: developer contact email (chip input).
  const contact = page.locator('input[aria-label*="email" i]').first();
  if ((await contact.count()) > 0) {
    await pacedFill(contact, params.supportEmail);
    await contact.press('Enter');
    await page.waitForTimeout(resolvePaceMs());
  }
  await advanceWizard(page);

  // Step 4 — Finish: agree to the user-data policy, then Create.
  const agree = page.locator('input[type="checkbox"]').first();
  if ((await agree.count()) > 0) await pacedDispatchClick(agree);
  const create = await firstPresent([page.getByRole('button', { name: /^create$/i })]);
  if (create) await pacedDispatchClick(create);
  await page.waitForTimeout(resolvePaceMs());
  log.log('[google] consent screen configured');
}

/**
 * Fill the "App domain" links (home page, privacy policy, terms of service) on the branding page.
 * Google shows these to users on the consent screen and requires the home page's host to be an
 * authorized domain — filling the home page URL registers that domain automatically.
 */
async function setAppDomain(
  page: Page,
  params: GoogleOAuthParams,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<void> {
  const { homepage, privacy, terms } = resolveAppDomain(params);
  await page.goto(consentUrl(params.projectId), { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // The branding page labels these "Application home page / privacy policy link / Terms of Service
  // link" with no formcontrolname, so we match by their (stable, human) label text. The page
  // renders lazily, so wait for the home-page field to attach (up to ~15s) before filling — a
  // fixed short pause let the home-page value silently fail to persist on the slow console.
  const byField: Array<[RegExp, string]> = [
    [/application home ?page/i, homepage],
    [/privacy policy/i, privacy],
    [/terms of service/i, terms],
  ];
  const homeField = page.getByLabel(byField[0]![0]).first();
  const ready = await homeField
    .waitFor({ state: 'attached', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!ready) {
    log.warn('[google] no app-domain fields found on the branding page — skipping domain links');
    return;
  }
  for (const [labelRe, value] of byField) {
    const field = page.getByLabel(labelRe).first();
    if ((await field.count()) > 0) await pacedFill(field, value);
  }
  const save = await firstPresent([page.getByRole('button', { name: /^save$/i })]);
  if (save) await pacedDispatchClick(save);
  log.log('[google] app-domain links set (home/privacy/terms)');
}

/**
 * Register the OAuth scopes on the Data Access page so they appear on the consent screen.
 *
 * The redesigned picker has no per-scope checkbox list; it exposes a "Manually paste scopes"
 * textarea + "Add to table" button (then "Update" then "Save"). We paste the fully-qualified scope
 * identifiers comma-separated, add them to the table, and save. A missing control is warned, not
 * fatal — sign-in still works on Google's implicit defaults.
 */
async function registerScopes(
  page: Page,
  params: GoogleOAuthParams,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<void> {
  const scopes = params.scopes ?? DEFAULT_OAUTH_SCOPES;
  await page.goto(dataAccessUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  // The Console renders this page's controls lazily; wait for the add button to attach (up to
  // ~15s) rather than a fixed short pause, which was too quick on the slow dev console.
  const addBtn = page
    .getByRole('button', { name: /add or remove scopes/i })
    .or(page.getByRole('button', { name: /add scopes/i }))
    .first();
  const addBtnReady = await addBtn
    .waitFor({ state: 'attached', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!addBtnReady) {
    log.warn('[google] no "Add or remove scopes" control — leaving scopes at their defaults');
    return;
  }
  await pacedDispatchClick(addBtn);

  // The picker panel opens with a "Manually paste scopes" textarea — wait for it, paste, add.
  const paste = page.getByLabel(/manually paste scopes/i).first();
  const pasteReady = await paste
    .waitFor({ state: 'attached', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);
  if (!pasteReady) {
    log.warn('[google] scope paste field did not appear — leaving scopes at their defaults');
    return;
  }
  await pacedFill(paste, scopes.join(', '));

  const addToTable = await firstPresent([page.getByRole('button', { name: /add to table/i })]);
  if (addToTable) await pacedDispatchClick(addToTable);

  const update = await firstPresent([page.getByRole('button', { name: /^update$/i })]);
  if (update) await pacedDispatchClick(update);

  const save = await firstPresent([page.getByRole('button', { name: /^save$/i })]);
  if (save) await pacedDispatchClick(save);
  await page.waitForTimeout(resolvePaceMs());
  log.log(`[google] registered scopes: ${scopes.join(' ')}`);
}

/**
 * Publish the app to Production (Audience page → "Publish app" → confirm). For non-sensitive
 * scopes this is instant with no review queue; any Google user can then sign in rather than only
 * test users. A no-op (with a log) if the app is already in production.
 */
async function publishApp(
  page: Page,
  params: GoogleOAuthParams,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<void> {
  await page.goto(audienceUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  // Wait for either the "Publish app" button (Testing) or an "In production" marker to attach,
  // so a slow render isn't misread as "nothing to do".
  const publish = page.getByRole('button', { name: /publish app/i }).first();
  const inProduction = page.getByText(/in production/i).first();
  await publish
    .or(inProduction)
    .first()
    .waitFor({ state: 'attached', timeout: 15_000 })
    .catch(() => undefined);

  if ((await inProduction.count()) > 0 && (await publish.count()) === 0) {
    log.log('[google] app already in production');
    return;
  }
  if ((await publish.count()) === 0) {
    log.warn('[google] no "Publish app" control found — the app may already be published');
    return;
  }
  await pacedDispatchClick(publish);
  await page.waitForTimeout(resolvePaceMs());

  // A confirmation dialog ("Push to production?") with a Confirm button.
  const confirm = await firstPresent([
    page.getByRole('button', { name: /^confirm$/i }),
    page.getByRole('button', { name: /^publish$/i }),
  ]);
  if (confirm) await pacedDispatchClick(confirm);
  await page.waitForTimeout(resolvePaceMs());
  log.log('[google] app published to production');
}

/** Navigate to this project's branding page and upload the logo (project-scoped URL). */
async function uploadLogoForProject(
  page: Page,
  params: GoogleOAuthParams,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<void> {
  if (!params.logoPath) return;
  await page.goto(consentUrl(params.projectId), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(resolvePaceMs());
  const fileInput = page.locator('input[type="file"]').first();
  if ((await fileInput.count()) === 0) {
    log.warn('[google] no logo upload control on the branding page — skipping logo');
    return;
  }
  await fileInput.setInputFiles(params.logoPath);
  await page.waitForTimeout(resolvePaceMs());
  const save = await firstPresent([page.getByRole('button', { name: /^save$/i })]);
  if (save) await pacedDispatchClick(save);
  log.log('[google] consent-screen logo uploaded');
}
