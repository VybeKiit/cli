import type { Page } from 'playwright';

import { isLsAuthenticatedUrl } from './authUrl';

export async function isLsAuthGateDom(page: Page): Promise<boolean> {
  const url = page.url();
  if (/(login|sign-?in|sign-?up|oauth|\/auth\/)/i.test(url)) return true;

  const signIn = page.getByRole('link', { name: /sign in|log in/i }).first();
  return (await signIn.count()) > 0 && (await signIn.isVisible().catch(() => false));
}

export async function isLsAuthenticatedDom(page: Page): Promise<boolean> {
  if (!page.url().includes('lemonsqueezy.com')) return false;
  if (await isLsAuthGateDom(page)) return false;
  if (!isLsAuthenticatedUrl(page.url())) return false;

  const nav = page.getByRole('link', { name: /products|orders|settings|dashboard/i }).first();
  return (await nav.count()) > 0 || isLsAuthenticatedUrl(page.url());
}
