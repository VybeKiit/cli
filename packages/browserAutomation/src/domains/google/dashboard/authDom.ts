import type { Page } from 'playwright';

import { isGoogleAuthenticatedUrl } from './authUrl';

/** Sign-in surface — Google account email/password controls visible. */
async function isGoogleSignInDom(page: Page): Promise<boolean> {
  if (/accounts\.google\.com/i.test(page.url())) return true;
  const emailInput = page.locator('input[type="email"]#identifierId, input[name="identifier"]');
  return (await emailInput.count()) > 0;
}

/** Signed-in Cloud Console — console chrome present, no sign-in gate. */
export async function isGoogleAuthenticatedDom(page: Page): Promise<boolean> {
  if (!page.url().includes('console.cloud.google.com')) return false;
  if (await isGoogleSignInDom(page)) return false;
  return isGoogleAuthenticatedUrl(page.url());
}
