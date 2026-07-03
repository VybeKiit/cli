import {
  pacedDispatchClick,
  pacedFill,
  resolvePaceMs,
} from '@vybekiit/browserAutomation/core/pace';
import { waitForGoogleAuthenticated } from '@vybekiit/browserAutomation/domains/google/dashboard/waitForAuthenticated';
import {
  parseClientId,
  parseClientSecret,
} from '@vybekiit/browserAutomation/domains/google/scrape';
import type {
  GoogleOAuthParams,
  GoogleOAuthResult,
} from '@vybekiit/browserAutomation/domains/google/types';
import { clientsUrl, createClientUrl } from '@vybekiit/browserAutomation/domains/google/urls';
import type { BrowserContext, Locator, Page } from 'playwright';

/** Consistent OAuth client display name so reruns can find and reuse it. */
function clientName(appName: string): string {
  return `${appName} Web`;
}

async function firstPresent(locators: Locator[]): Promise<Locator | null> {
  for (const locator of locators) {
    if ((await locator.count()) > 0) return locator.first();
  }
  return null;
}

/** Poll the page HTML for a `GOCSPX-` secret (+ client id) up to a bounded window. */
async function pollForSecret(
  page: Page,
  attempts = 20,
): Promise<{ clientId: string | null; clientSecret: string } | null> {
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
}

/**
 * Add the two authorized redirect URIs.
 *
 * The Web-client form has TWO repeatable URI sections — "JavaScript origins" and "redirect
 * URIs" — both rendering `input[formcontrolname="uri"]`. We scope strictly to the redirect
 * container so origins (which reject paths) never receive a callback URL.
 */
async function fillRedirectUris(
  page: Page,
  redirectUris: readonly string[],
  log: Pick<Console, 'log' | 'warn'>,
): Promise<void> {
  const redirectSection = page
    .locator('.cfc-form-stack-container', { hasText: /redirect uris/i })
    .filter({ hasNot: page.locator('text=/javascript origins/i') })
    .first();
  const scope = (await redirectSection.count()) > 0 ? redirectSection : page.locator('body');

  const addUri = scope.getByRole('button', { name: /add uri/i }).first();
  for (let i = 0; i < redirectUris.length; i++) {
    if ((await addUri.count()) > 0) await pacedDispatchClick(addUri);
  }

  const inputs = scope.locator('input[formcontrolname="uri"]');
  const count = await inputs.count();
  for (let i = 0; i < redirectUris.length && i < count; i++) {
    const uri = redirectUris[i]!;
    await pacedFill(inputs.nth(i), uri);
  }
  if (count < redirectUris.length) {
    log.warn(
      `[google] only ${count} redirect field(s) available for ${redirectUris.length} URI(s) — add the rest manually if needed`,
    );
  }
}

/**
 * Add a fresh secret to an existing same-named client and read it back.
 *
 * Google's redesigned console no longer lets you view or download a client's secret after
 * creation — the only way to obtain a readable secret is to add a new one on the client's
 * detail page ("Information and summary" panel → "Add secret"). Returns null if no matching
 * client exists so the caller can fall through to creating one.
 */
async function addSecretToExistingClient(
  page: Page,
  params: GoogleOAuthParams,
  context: BrowserContext,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<GoogleOAuthResult | null> {
  await page.goto(clientsUrl(params.projectId), { waitUntil: 'domcontentloaded', timeout: 60_000 });
  page = await waitForGoogleAuthenticated(page, log, context);
  await page.waitForTimeout(resolvePaceMs());

  const link = await firstPresent([
    page.getByRole('link', { name: new RegExp(`^${clientName(params.appName)}$`, 'i') }),
  ]);
  if (!link) return null;

  log.log('[google] existing OAuth client found — adding a new secret');
  const clientId = parseClientId(
    await page
      .locator('body')
      .innerHTML()
      .catch(() => ''),
  );
  await pacedDispatchClick(link);
  await page.waitForTimeout(resolvePaceMs());

  // Open the info/summary panel that hosts the "Client secrets" section.
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
  // A confirmation dialog may re-present an "Add secret" button.
  const confirm = await firstPresent([
    page.getByRole('button', { name: /^add secret$/i }),
    page.getByRole('button', { name: /^add$/i }),
  ]);
  if (confirm) await pacedDispatchClick(confirm);

  const creds = await pollForSecret(page);
  if (!creds) return null;
  return {
    clientId: creds.clientId ?? clientId ?? '',
    clientSecret: creds.clientSecret,
    projectId: params.projectId,
    reusedExisting: true,
  };
}

/**
 * Create a Web OAuth client (or add a secret to a same-named existing one) and read back the
 * credentials. Secrets are shown once and unreadable afterwards, so "reuse" adds a new secret.
 *
 * Every click uses `pacedDispatchClick` because the Console overlay intercepts real pointer
 * gestures; text inputs use fill. The create-success dialog auto-dismisses on the slow console,
 * so we always open the client's detail page and add a secret to obtain a readable value.
 */
export async function createOAuthClient(
  page: Page,
  params: GoogleOAuthParams,
  context?: BrowserContext,
  log: Pick<Console, 'log' | 'warn'> = console,
): Promise<GoogleOAuthResult> {
  const ctx = context ?? page.context();

  if (params.resetSecret) {
    const reused = await addSecretToExistingClient(page, params, ctx, log);
    if (reused) return reused;
    log.log('[google] no existing client to reuse — creating a new one');
  }

  await page.goto(createClientUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  page = await waitForGoogleAuthenticated(page, log, ctx);
  await page.waitForTimeout(resolvePaceMs());

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

  await fillRedirectUris(page, params.redirectUris, log);

  const create = await firstPresent([page.getByRole('button', { name: /^create$/i })]);
  if (!create) {
    throw new Error(
      'Could not find the "Create" button on the OAuth client form — finish it manually and retry.',
    );
  }
  await pacedDispatchClick(create);

  // The client now exists, but its first secret is not reliably capturable from the transient
  // dialog. Reopen it and add a secret to read a fresh, well-formed value.
  const withSecret = await addSecretToExistingClient(page, params, ctx, log);
  if (withSecret) return { ...withSecret, reusedExisting: false };

  // Fallback: try to read whatever the create dialog left on the page.
  const creds = await pollForSecret(page, 5);
  if (!creds?.clientId) {
    throw new Error(
      'OAuth client was created but a readable secret could not be captured. Open the client in the Console, add a secret, and paste the Client ID + secret into .env.',
    );
  }
  return {
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
    projectId: params.projectId,
    reusedExisting: false,
  };
}
