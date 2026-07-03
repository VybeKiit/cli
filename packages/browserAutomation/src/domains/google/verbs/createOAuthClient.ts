import { pacedClick, pacedFill } from '@vybekiit/browserAutomation/core/pace';
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

/** Read clientId + secret from the "OAuth client created" dialog (secret shown once). */
async function readCredentialsFromDialog(page: Page): Promise<{
  clientId: string;
  clientSecret: string;
} | null> {
  const dialog = page.locator('[role="dialog"], .cfc-panel, mat-dialog-container').first();
  const scope = (await dialog.count()) > 0 ? dialog : page.locator('body');
  const html = await scope.innerHTML().catch(() => page.content());
  const clientId = parseClientId(html);
  const clientSecret = parseClientSecret(html);
  if (clientId && clientSecret) return { clientId, clientSecret };
  return null;
}

async function fillRedirectUris(page: Page, redirectUris: readonly string[]): Promise<void> {
  for (let i = 0; i < redirectUris.length; i++) {
    const uri = redirectUris[i]!;
    if (i > 0) {
      const addUri = await firstPresent([
        page.getByRole('button', { name: /add uri/i }),
        page.getByRole('button', { name: /add redirect/i }),
      ]);
      if (addUri) await pacedClick(addUri);
    }
    const field = await firstPresent([
      page.getByLabel(new RegExp(`uris?\\s*${i + 1}`, 'i')),
      page.locator('input[aria-label*="URI" i]').nth(i),
      page.locator('input[type="text"]').last(),
    ]);
    if (field) await pacedFill(field, uri);
  }
}

/** Open an existing same-named client and reset its secret (the only way to read a fresh one). */
async function resetExistingClientSecret(
  page: Page,
  params: GoogleOAuthParams,
  context: BrowserContext,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<GoogleOAuthResult | null> {
  await page.goto(clientsUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  page = await waitForGoogleAuthenticated(page, log, context);

  const link = await firstPresent([
    page.getByRole('link', { name: new RegExp(clientName(params.appName), 'i') }),
  ]);
  if (!link) return null;

  log.log('[google] existing OAuth client found — resetting secret');
  await pacedClick(link);

  const reset = await firstPresent([page.getByRole('button', { name: /reset secret/i })]);
  if (!reset) {
    throw new Error(
      'Found the OAuth client but no "Reset secret" control. Reset it manually in the Console, then paste the secret into .env.',
    );
  }
  await pacedClick(reset);
  const confirm = await firstPresent([page.getByRole('button', { name: /^reset$/i })]);
  if (confirm) await pacedClick(confirm);

  const creds = await readCredentialsFromDialog(page);
  if (!creds) return null;
  return { ...creds, projectId: params.projectId, reusedExisting: true };
}

/**
 * Create a Web OAuth client (or reset the secret on a same-named existing one) and read
 * back the credentials. The secret is shown only once at creation, so reuse means reset.
 */
export async function createOAuthClient(
  page: Page,
  params: GoogleOAuthParams,
  context?: BrowserContext,
  log: Pick<Console, 'log' | 'warn'> = console,
): Promise<GoogleOAuthResult> {
  const ctx = context ?? page.context();

  if (params.resetSecret) {
    const reused = await resetExistingClientSecret(page, params, ctx, log);
    if (reused) return reused;
    log.log('[google] no existing client to reset — creating a new one');
  }

  await page.goto(createClientUrl(params.projectId), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  page = await waitForGoogleAuthenticated(page, log, ctx);

  // Application type → "Web application".
  const typeSelect = await firstPresent([
    page.getByLabel(/application type/i),
    page.getByRole('combobox', { name: /application type/i }),
  ]);
  if (typeSelect) {
    await pacedClick(typeSelect);
    const webOption = await firstPresent([page.getByRole('option', { name: /web application/i })]);
    if (webOption) await pacedClick(webOption);
  }

  const nameField = await firstPresent([
    page.getByLabel(/^name$/i),
    page.getByRole('textbox', { name: /name/i }),
  ]);
  if (nameField) await pacedFill(nameField, clientName(params.appName));

  await fillRedirectUris(page, params.redirectUris);

  const create = await firstPresent([page.getByRole('button', { name: /^create$/i })]);
  if (!create) {
    throw new Error(
      'Could not find the "Create" button on the OAuth client form — finish it manually and retry.',
    );
  }
  await pacedClick(create);

  const creds = await readCredentialsFromDialog(page);
  if (!creds) {
    throw new Error(
      'OAuth client was created but the credentials could not be read from the dialog. Copy the Client ID and secret manually into .env.',
    );
  }
  return { ...creds, projectId: params.projectId, reusedExisting: false };
}
