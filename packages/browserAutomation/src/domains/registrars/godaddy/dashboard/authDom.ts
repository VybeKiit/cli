import type { Page } from 'playwright';

import { isGdAuthenticatedUrl } from './authUrl';

export async function isGdAuthGateDom(page: Page): Promise<boolean> {
  const url = page.url();
  if (/sso\.godaddy\.com/i.test(url)) return true;

  const username = page.locator('#username, input[name="username"], input[type="email"]').first();
  const signIn = page.getByRole('button', { name: /^sign in$/i }).first();
  if ((await username.count()) > 0 && (await username.isVisible().catch(() => false))) {
    return true;
  }
  return (await signIn.count()) > 0 && (await signIn.isVisible().catch(() => false));
}

export async function isGdAuthenticatedDom(page: Page): Promise<boolean> {
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
}
