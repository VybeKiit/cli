import type { Page } from 'playwright';

import { isLsAuthenticatedUrl } from './authUrl';

// `https://app.lemonsqueezy.com/login` -> match.
const LS_AUTH_GATE_URL_PATTERN = /(login|sign-?in|sign-?up|oauth|\/auth\/)/i;
// `Sign in` link -> match.
const SIGN_IN_LINK_PATTERN = /sign in|log in/i;
// `Products` nav link -> match.
const DASHBOARD_NAV_PATTERN = /products|orders|settings|dashboard/i;

/**
 * Check whether the current Lemon Squeezy page still shows an auth gate.
 *
 * @param page - Playwright page to inspect.
 * @returns True when the page URL or DOM still looks unauthenticated.
 * @example
 * const gated = await isLsAuthGateDom(page);
 */
export const isLsAuthGateDom = async (page: Page): Promise<boolean> => {
  const url = page.url();
  if (LS_AUTH_GATE_URL_PATTERN.test(url)) {
    return true;
  }

  const signIn = page.getByRole('link', { name: SIGN_IN_LINK_PATTERN }).first();
  return (await signIn.count()) > 0 && (await signIn.isVisible().catch(() => false));
};

/**
 * Check whether the current page has signed-in Lemon Squeezy dashboard DOM.
 *
 * @param page - Playwright page to inspect.
 * @returns True when the URL and navigation look authenticated.
 * @example
 * const ready = await isLsAuthenticatedDom(page);
 */
export const isLsAuthenticatedDom = async (page: Page): Promise<boolean> => {
  if (!page.url().includes('lemonsqueezy.com')) {
    return false;
  }
  if (await isLsAuthGateDom(page)) {
    return false;
  }
  if (!isLsAuthenticatedUrl(page.url())) {
    return false;
  }

  const nav = page.getByRole('link', { name: DASHBOARD_NAV_PATTERN }).first();
  return (await nav.count()) > 0 || isLsAuthenticatedUrl(page.url());
};
