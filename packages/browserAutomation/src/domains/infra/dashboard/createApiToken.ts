import { CLOUDFLARE_DASHBOARD_URL } from '@vybekiit/browser-automation/core/constants';
import type { Page } from 'playwright';
import { scrapeCfAccountIdFromUrl, scrapeCfTokenFromHtml } from './scrape';

const DASH_ORIGIN = CLOUDFLARE_DASHBOARD_URL;

export type CreateCfTokenResult = {
  token: string;
  accountId: string;
  name: string;
};

/**
 * Resolve the Cloudflare account id, preferring the caller's value, then the current
 * dashboard URL, then a fresh dashboard visit (an authenticated dashboard always
 * redirects to `/{accountId}/…`, so the id is in the URL once signed in).
 *
 * @param page - Playwright page attached to an authenticated Cloudflare dashboard.
 * @param accountId - Optional account id supplied by the caller (e.g. from wrangler).
 * @returns The resolved 32-hex account id.
 */
const resolveAccountId = async (page: Page, accountId?: string): Promise<string> => {
  let resolved = accountId ?? scrapeCfAccountIdFromUrl(page.url()) ?? undefined;
  if (resolved === undefined) {
    await page.goto(DASH_ORIGIN, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2500);
    resolved = scrapeCfAccountIdFromUrl(page.url()) ?? undefined;
  }
  if (resolved === undefined) {
    throw new Error(
      'Cloudflare account id could not be resolved; cannot open the account-scoped token editor.',
    );
  }
  return resolved;
};

/**
 * Grant "Workers Scripts: Edit" — the scope an OpenNext/wrangler deploy needs — through
 * Cloudflare's 2026-07 permission-group picker: type the group name into the search box,
 * then click the matching row's `Edit` toggle. (Cloudflare replaced the old
 * `li [role="checkbox"]` list with this search + Read/Edit toggle model.) Add further
 * groups the same way (search + toggle) if a deploy needs KV/R2/D1/Pages scopes.
 *
 * @param page - Playwright page on the account-scoped token editor.
 * @returns Nothing; mutates the open policy in place.
 */
const grantWorkersScriptsEdit = async (page: Page): Promise<void> => {
  const search = page.getByPlaceholder(/search for permission groups/i).first();
  await search.waitFor({ state: 'visible', timeout: 25_000 });
  await search.click();
  await search.fill('Workers Scripts');
  await page.waitForTimeout(1800);
  await page
    .getByText('Workers Scripts', { exact: true })
    .first()
    .locator('xpath=following::*[normalize-space()="Edit"][1]')
    .click({ timeout: 8000 });
  await page.waitForTimeout(800);
};

/**
 * Mint a Workers-scoped Cloudflare API token via the dashboard (browser fallback —
 * wrangler cannot create arbitrary scoped tokens) and scrape the one-time value.
 *
 * MUST open the ACCOUNT-scoped editor `/{accountId}/api-tokens/create`. The user-scoped
 * `/profile/api-tokens/create` route forces an "Account Resources" React-Select that stalls
 * headless automation — going to that wrong URL was the historical failure mode. See the
 * infra README and issue #66 for the full 2026-07 UI-drift context (unlabeled name field,
 * search + Read/Edit permission toggles, "Review token" instead of "Continue to summary").
 *
 * @param page - Playwright page attached to an authenticated Cloudflare dashboard.
 * @param name - Desired token name (Cloudflare pre-fills a random one; overwritten best-effort).
 * @param accountId - Optional account id; resolved from the dashboard URL when omitted.
 * @returns The minted token, its account id, and the name.
 * @example
 * const result = await createApiToken(page, 'vybekiit-deploy', 'b0ba…');
 */
export const createApiToken = async (
  page: Page,
  name: string,
  accountId?: string,
): Promise<CreateCfTokenResult> => {
  const resolvedAccountId = await resolveAccountId(page, accountId);

  await page.goto(`${DASH_ORIGIN}/${resolvedAccountId}/api-tokens/create`, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  // Token name is an unlabeled input that Cloudflare pre-fills with a random name; overwrite
  // it best-effort (never fail the mint if this selector drifts).
  await page
    .getByText(/^token name$/i)
    .locator('xpath=following::input[1]')
    .first()
    .fill(name, { timeout: 20_000 })
    .catch(() => undefined);

  await grantWorkersScriptsEdit(page);

  // The account-scoped editor's action is "Review token" (the older user-scoped flow said
  // "Continue to summary" — accept either).
  const reviewButton = page
    .getByRole('button', { name: /review token|continue to summary/i })
    .first();
  await reviewButton.waitFor({ state: 'visible', timeout: 15_000 });
  await reviewButton.click({ timeout: 8000 });

  const confirmButton = page.getByRole('button', { name: /create token/i }).last();
  await confirmButton.waitFor({ state: 'visible', timeout: 15_000 });
  await confirmButton.click({ timeout: 8000 });

  // The success screen reveals the `cfat_…` value once.
  await page
    .waitForFunction('/cfat_[A-Za-z0-9_-]{20,}/.test(document.body.innerHTML)', undefined, {
      timeout: 15_000,
    })
    .catch(() => undefined);
  const token = scrapeCfTokenFromHtml(await page.content());
  if (!token) {
    throw new Error(
      'Cloudflare token was created but could not be read from the success screen (copy it manually).',
    );
  }
  return { token, accountId: resolvedAccountId, name };
};
