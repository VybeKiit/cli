import {
  pacedDispatchClick,
  pacedFill,
  resolvePaceMs,
} from '@vybekiit/browser-automation/core/pace';
import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import {
  fillJsOrigins,
  fillRedirectUris,
  saveAuthPlatformClientForm,
  waitForAuthPlatformForm,
} from '@vybekiit/browser-automation/domains/google/dashboard/authPlatformForm';
import { waitForGoogleAuthenticated } from '@vybekiit/browser-automation/domains/google/dashboard/waitForAuthenticated';
import { resolveJsOrigins } from '@vybekiit/browser-automation/domains/google/oauthUris';
import {
  parseClientId,
  parseClientSecret,
} from '@vybekiit/browser-automation/domains/google/scrape';
import type {
  GoogleOAuthParams,
  GoogleOAuthResult,
} from '@vybekiit/browser-automation/domains/google/types';
import { clientsUrl, createClientUrl } from '@vybekiit/browser-automation/domains/google/urls';
import type { BrowserContext, Locator, Page } from 'playwright';

/** Consistent OAuth client display name so reruns can find and reuse it. */
const clientName = (appName: string): string => `${appName} Web`;

const firstPresent = async (locators: Locator[]): Promise<Locator | null> => {
  for (const locator of locators) {
    if ((await locator.count()) > 0) return locator.first();
  }
  return null;
};

/** Poll the page HTML for a `GOCSPX-` secret (+ client id) up to a bounded window. */
const pollForSecret = async (
  page: Page,
  attempts = 20,
): Promise<{ clientId: string | null; clientSecret: string } | null> => {
  for (let i = 0; i < attempts; i++) {
    await page.waitForTimeout(1000);
    const html = await page
      .locator('body')
      .innerHTML()
      .catch(() => '');
    const clientSecret = parseClientSecret(html);
    if (clientSecret) return { clientId: parseClientId(html), clientSecret };
  }
  return null;
};

/**
 * Find the same-named Web client on the clients list, if any.
 *
 * @param page - Playwright page (navigated to clients list).
 * @param appName - App name used to build `{appName} Web`.
 * @returns Link locator or null.
 */
const findExistingClientLink = async (page: Page, appName: string): Promise<Locator | null> =>
  firstPresent([page.getByRole('link', { name: new RegExp(`^${clientName(appName)}$`, 'i') })]);

/**
 * Read client ID from the clients list or detail page HTML.
 *
 * @param page - Playwright page.
 * @returns Parsed client id or null.
 */
const readClientIdFromPage = async (page: Page): Promise<string | null> => {
  const html = await page
    .locator('body')
    .innerHTML()
    .catch(() => '');
  return parseClientId(html);
};

/**
 * Open the existing client detail and apply redirect URIs + JS origins (no secret).
 *
 * @param page - Playwright page.
 * @param params - OAuth params.
 * @param context - Browser context.
 * @param log - Verb logger.
 * @returns Patch result, or null when the client does not exist.
 */
const patchExistingClient = async (
  page: Page,
  params: GoogleOAuthParams,
  context: BrowserContext,
  log: Pick<VerbLogger, 'log' | 'warn'>,
): Promise<GoogleOAuthResult | null> => {
  await page.goto(clientsUrl(params.projectId), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  page = await waitForGoogleAuthenticated(page, log, context);
  await page.waitForTimeout(resolvePaceMs());

  const link = await findExistingClientLink(page, params.appName);
  if (!link) return null;

  log.log(`[google] existing OAuth client "${clientName(params.appName)}" — patching URIs/origins`);
  await pacedDispatchClick(link);
  await page.waitForTimeout(resolvePaceMs());
  page = await waitForAuthPlatformForm(page);

  // Some shells show a read-only summary; click Edit when present.
  const edit = await firstPresent([
    page.getByRole('button', { name: /^edit$/i }),
    page.getByRole('link', { name: /^edit$/i }),
  ]);
  if (edit) {
    await pacedDispatchClick(edit);
    await page.waitForTimeout(resolvePaceMs());
    page = await waitForAuthPlatformForm(page);
  }

  const origins = resolveJsOrigins(params.redirectUris, params.jsOrigins);
  const originsApplied = await fillJsOrigins(page, origins, log);
  const redirectsApplied = await fillRedirectUris(page, params.redirectUris, log);
  await saveAuthPlatformClientForm(page, log);

  const clientId = await readClientIdFromPage(page);
  if (clientId === null) {
    throw new Error(
      'Patched OAuth client URIs but could not read the Client ID from the Console. Copy it manually into .env if needed.',
    );
  }

  let clientSecret: string | undefined;
  if (params.resetSecret === true) {
    log.log('[google] --reset-secret: minting a fresh client secret on existing client');
    const { clientSecret: minted } = await addSecretOnOpenClient(
      page,
      clientId,
      params.projectId,
      log,
    );
    clientSecret = minted;
  }

  return {
    clientId,
    ...(clientSecret === undefined ? {} : { clientSecret }),
    projectId: params.projectId,
    reusedExisting: true,
    redirectsApplied,
    originsApplied,
  };
};

/**
 * Add a fresh secret on an already-open client detail page.
 *
 * @param page - Client detail page.
 * @param fallbackClientId - Client id if the dialog omits it.
 * @param projectId - GCP project id.
 * @param log - Verb logger.
 * @returns Credentials with secret.
 */
const addSecretOnOpenClient = async (
  page: Page,
  fallbackClientId: string,
  projectId: string,
  log: Pick<VerbLogger, 'log' | 'warn'>,
): Promise<{ clientId: string; clientSecret: string; projectId: string }> => {
  const infoPanel = await firstPresent([
    page.getByRole('button', { name: /information and summary/i }),
  ]);
  if (infoPanel) await pacedDispatchClick(infoPanel);
  await page.waitForTimeout(resolvePaceMs());

  const addSecret = await firstPresent([page.getByRole('button', { name: /^add secret$/i })]);
  if (!addSecret) {
    throw new Error(
      'Found the OAuth client but no "Add secret" control. Add a secret manually on the client page, then paste it into .env.',
    );
  }
  await pacedDispatchClick(addSecret);
  const confirm = await firstPresent([
    page.getByRole('button', { name: /^add secret$/i }),
    page.getByRole('button', { name: /^add$/i }),
  ]);
  if (confirm) await pacedDispatchClick(confirm);

  const creds = await pollForSecret(page);
  if (!creds) {
    throw new Error(
      'Added a client secret but could not read the GOCSPX- value. Copy it from the Console into .env.',
    );
  }
  const resolvedClientId = creds.clientId === null ? fallbackClientId : creds.clientId;
  log.log('[google] new client secret captured');
  return {
    clientId: resolvedClientId,
    clientSecret: creds.clientSecret,
    projectId,
  };
};

/**
 * Add a fresh secret to an existing same-named client (list → open → add secret).
 *
 * Used after create when the first secret dialog is unreliable, or when `--reset-secret`
 * is set without a prior patch path.
 *
 * @param page - Playwright page.
 * @param params - OAuth params.
 * @param context - Browser context.
 * @param log - Verb logger.
 * @returns Result with secret, or null if the client is missing.
 */
const addSecretToExistingClient = async (
  page: Page,
  params: GoogleOAuthParams,
  context: BrowserContext,
  log: Pick<VerbLogger, 'log' | 'warn'>,
): Promise<GoogleOAuthResult | null> => {
  await page.goto(clientsUrl(params.projectId), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  page = await waitForGoogleAuthenticated(page, log, context);
  await page.waitForTimeout(resolvePaceMs());

  const link = await findExistingClientLink(page, params.appName);
  if (!link) return null;

  log.log('[google] existing OAuth client found — adding a new secret');
  const listClientId = await readClientIdFromPage(page);
  await pacedDispatchClick(link);
  await page.waitForTimeout(resolvePaceMs());

  const fallbackId = listClientId === null ? '' : listClientId;
  const creds = await addSecretOnOpenClient(page, fallbackId, params.projectId, log);
  if (creds.clientId.length === 0) {
    throw new Error(
      'Google showed a new OAuth secret but no client ID. Open the client details, copy the Client ID, and paste it into .env.',
    );
  }

  return {
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    projectId: params.projectId,
    reusedExisting: true,
  };
};

/**
 * Create a new Web OAuth client with redirects + JS origins, then capture a secret.
 *
 * @param page - Playwright page.
 * @param params - OAuth params.
 * @param context - Browser context.
 * @param log - Verb logger.
 * @returns Create result with secret and applied URIs.
 */
const createNewOAuthClient = async (
  page: Page,
  params: GoogleOAuthParams,
  context: BrowserContext,
  log: Pick<VerbLogger, 'log' | 'warn'>,
): Promise<GoogleOAuthResult> => {
  await page.goto(createClientUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  page = await waitForGoogleAuthenticated(page, log, context);
  await page.waitForTimeout(resolvePaceMs());
  page = await waitForAuthPlatformForm(page);

  // Application type → "Web application" (a cfc-select).
  const typeSelect = await firstPresent([page.locator('[formcontrolname="typeControl"]')]);
  if (typeSelect) {
    await pacedDispatchClick(typeSelect);
    const webOption = await firstPresent([
      page.getByRole('option', { name: /^web application$/i }),
    ]);
    if (webOption) await pacedDispatchClick(webOption);
  }

  const nameField = await firstPresent([page.locator('input[formcontrolname="displayName"]')]);
  if (!nameField) {
    throw new Error(
      'The OAuth client form did not load (no name field). Retry — the Console can be slow to render.',
    );
  }
  await pacedFill(nameField, clientName(params.appName));

  const origins = resolveJsOrigins(params.redirectUris, params.jsOrigins);
  const originsApplied = await fillJsOrigins(page, origins, log);
  const redirectsApplied = await fillRedirectUris(page, params.redirectUris, log);

  const create = await firstPresent([page.getByRole('button', { name: /^create$/i })]);
  if (!create) {
    throw new Error(
      'Could not find the "Create" button on the OAuth client form — finish it manually and retry.',
    );
  }
  await pacedDispatchClick(create);

  // The client now exists, but its first secret is not reliably capturable from the transient
  // dialog. Reopen it and add a secret to read a fresh, well-formed value.
  const withSecret = await addSecretToExistingClient(page, params, context, log);
  if (withSecret) {
    return {
      ...withSecret,
      reusedExisting: false,
      redirectsApplied,
      originsApplied,
    };
  }

  const creds = await pollForSecret(page, 5);
  if (creds === null || creds.clientId === null) {
    throw new Error(
      'OAuth client was created but a readable secret could not be captured. Open the client in the Console, add a secret, and paste the Client ID + secret into .env.',
    );
  }
  return {
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    projectId: params.projectId,
    reusedExisting: false,
    redirectsApplied,
    originsApplied,
  };
};

/**
 * Create or idempotently patch a Web OAuth client and optionally mint a secret.
 *
 * Happy path for agents hitting `redirect_uri_mismatch`: re-run with the same
 * `--app-name` and full `--redirect` list (incl. localhost). Existing clients are
 * patched in place — **no new secret** unless `--reset-secret`.
 *
 * @param page - Playwright page to inspect or mutate.
 * @param params - Validated automation parameters for the operation.
 * @param context - Browser context used for authenticated waits.
 * @param log - Verb logger.
 * @returns Promise resolving with client id, optional secret, and applied URIs.
 * @example
 * const result = await createOAuthClient(page, params, context, log);
 */
export const createOAuthClient = async (
  page: Page,
  params: GoogleOAuthParams,
  context?: BrowserContext,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
): Promise<GoogleOAuthResult> => {
  const ctx = context === undefined ? page.context() : context;

  // Prefer patch when a same-named client exists (fixes redirect_uri_mismatch without secret churn).
  const patched = await patchExistingClient(page, params, ctx, log);
  if (patched) return patched;

  log.log('[google] no existing client — creating a new Web OAuth client');
  return createNewOAuthClient(page, params, ctx, log);
};
