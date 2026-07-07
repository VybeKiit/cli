import type { Page } from 'playwright';

import { isGdAuthenticatedUrl } from './authUrl';

/**
 * Is Gd Auth Gate Dom.
 *
 * @param page - Playwright page to inspect or mutate.
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = await isGdAuthGateDom(page);
 */
export const isGdAuthGateDom = async (page: Page): Promise<boolean> => {
  const url = page.url();
  if (/sso\.godaddy\.com/i.test(url)) return true;

  const username = page.locator('#username, input[name="username"], input[type="email"]').first();
  const signIn = page.getByRole('button', { name: /^sign in$/i }).first();
  if ((await username.count()) > 0 && (await username.isVisible().catch(() => false))) {
    return true;
  }
  return (await signIn.count()) > 0 && (await signIn.isVisible().catch(() => false));
};

/**
 * Is Gd Authenticated Dom.
 *
 * @param page - Playwright page to inspect or mutate.
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = await isGdAuthenticatedDom(page);
 */
export const isGdAuthenticatedDom = async (page: Page): Promise<boolean> => {
  if (!page.url().includes('godaddy.com')) return false;
  if (await isGdAuthGateDom(page)) return false;

  if (isGdAuthenticatedUrl(page.url())) {
    const createKey = page.getByRole('button', { name: /create new api key/i }).first();
    const keysHeading = page.getByText(/api keys|developer keys/i).first();
    if ((await createKey.count()) > 0) return true;
    if ((await keysHeading.count()) > 0) return true;
    return !/sso\.godaddy\.com/i.test(page.url());
  }

  return false;
};
