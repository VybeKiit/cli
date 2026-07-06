import { CLOUDFLARE_DASHBOARD_URL } from '@vybekiit/browserAutomation/core/constants';
import type { Page } from 'playwright';
import { scrapeCfAccountIdFromUrl, scrapeCfTokenFromHtml } from './scrape';

const DASH_ORIGIN = CLOUDFLARE_DASHBOARD_URL;

/**
 * Grant full access by ticking every permission-group access level, run in the page context.
 *
 * Cloudflare's account-owned token editor lists ~130 permission groups as `<li>` rows, each
 * exposing one or more access checkboxes (`Read`/`Edit`/`Run`/`Revoke`/`Send`/`Evaluate`/
 * `Admin`/…). The levels are ADDITIVE (independent checkboxes, not a single-select), so full
 * access means checking every box in every row. Returns the number newly checked so the caller
 * can assert progress. Native `.click()` toggles rows even inside collapsed category accordions.
 *
 * Kept as a string-body `page.evaluate` (not a typed import) because it touches the live
 * Cloudflare DOM (`role="checkbox"` Kumo controls) which has no types on our side.
 */
async function selectAllPermissions(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
    const isChecked = (el: Element): boolean => el.getAttribute('aria-checked') === 'true';
    // Access checkboxes live inside the permission-group <li> rows (skip any stray checkboxes
    // elsewhere on the page such as cookie/consent toggles).
    const boxes = Array.from(document.querySelectorAll('li [role="checkbox"]'));

    let selected = 0;
    for (const box of boxes) {
      if (isChecked(box)) continue;
      box.scrollIntoView({ block: 'center', inline: 'center' });
      (box as HTMLElement).click();
      await sleep(20);
      if (isChecked(box)) selected++;
    }
    return selected;
  });
}

export interface CreateCfTokenResult {
  token: string;
  accountId: string;
  name: string;
}

/**
 * Mint a full-access Cloudflare API token via the dashboard (browser fallback — wrangler can't
 * create arbitrary scoped tokens). Navigates straight to the custom-token editor, fills the
 * name, grants every permission group, then reviews + creates and scrapes the one-time value.
 */
export async function createApiToken(
  page: Page,
  name: string,
  accountId?: string,
): Promise<CreateCfTokenResult> {
  const resolvedAccountId = accountId ?? scrapeCfAccountIdFromUrl(page.url()) ?? undefined;

  // The custom-token editor is a dedicated route; visiting it directly avoids the tokens-list
  // "Create Token" control (which is a link, not a button) and lands in the editor.
  const createUrl = resolvedAccountId
    ? `${DASH_ORIGIN}/${resolvedAccountId}/api-tokens/create`
    : `${DASH_ORIGIN}/profile/api-tokens/create`;
  await page.goto(createUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // Token name field — accessible name / placeholder first.
  const nameField = page
    .getByRole('textbox', { name: /token name/i })
    .or(page.getByPlaceholder(/token name/i))
    .first();
  await nameField.waitFor({ state: 'visible', timeout: 20_000 });
  await nameField.fill(name);

  // Wait for the async permission-group rows to render before selecting.
  await page
    .waitForFunction('document.querySelectorAll(\'li [role="checkbox"]\').length > 20', undefined, {
      timeout: 30_000,
    })
    .catch(() => undefined);

  const selected = await selectAllPermissions(page);
  if (selected === 0) {
    throw new Error(
      'Cloudflare token editor loaded but no permission checkboxes were selected (DOM may have changed).',
    );
  }

  // Continue to the summary screen.
  const reviewButton = page
    .getByRole('button', { name: /review token|continue to summary/i })
    .first();
  await reviewButton.waitFor({ state: 'visible', timeout: 15_000 });
  await reviewButton.click({ timeout: 8000 });

  // Create Token on the summary screen.
  const confirmButton = page.getByRole('button', { name: /create token/i }).first();
  await confirmButton.waitFor({ state: 'visible', timeout: 15_000 });
  await confirmButton.click({ timeout: 8000 });

  // "Token created successfully" dialog reveals the token value once.
  await page
    .waitForFunction('/cfat_[A-Za-z0-9]{20,}/.test(document.body.innerHTML)', undefined, {
      timeout: 15_000,
    })
    .catch(() => undefined);
  const html = await page.content();
  const token = scrapeCfTokenFromHtml(html);
  if (!token) {
    throw new Error(
      'Cloudflare token was created but could not be read from the success dialog (copy it manually).',
    );
  }
  const finalAccountId = resolvedAccountId ?? scrapeCfAccountIdFromUrl(html) ?? '';
  return { token, accountId: finalAccountId, name };
}
