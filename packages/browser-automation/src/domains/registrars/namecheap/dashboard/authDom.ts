import type { Page } from 'playwright';

import { isNcAuthenticatedUrl } from './authUrl';

/** Login / signup surface — sign-in controls visible. */
export async function isNcAuthGateDom(page: Page): Promise<boolean> {
  const hostPath = page.url();
  if (/\/myaccount\/(?:login|sign)/i.test(hostPath)) return true;

  const signIn = page.getByRole('button', { name: /^sign in$/i });
  if (
    (await signIn.count()) > 0 &&
    (await signIn
      .first()
      .isVisible()
      .catch(() => false))
  ) {
    return true;
  }

  const loginForm = page.locator('form[action*="login" i], #loginForm, [data-test="login-form"]');
  return (await loginForm.count()) > 0;
}

/** Signed-in API access dashboard — no login gate in DOM. */
export async function isNcAuthenticatedDom(page: Page): Promise<boolean> {
  if (!page.url().includes('namecheap.com')) return false;
  if (await isNcAuthGateDom(page)) return false;

  if (isNcAuthenticatedUrl(page.url()) && /apiaccess/i.test(page.url())) return true;

  const apiAccessLabel = page.getByText(/api access/i).first();
  const apiKeyField = page.locator('input[name*="ApiKey" i], input[id*="apikey" i]').first();
  const enableBtn = page.getByRole('button', { name: /enable api access/i }).first();

  if ((await apiAccessLabel.count()) > 0 && (await apiAccessLabel.isVisible().catch(() => false))) {
    return true;
  }
  if ((await apiKeyField.count()) > 0) return true;
  if ((await enableBtn.count()) > 0) return true;

  return isNcAuthenticatedUrl(page.url());
}
