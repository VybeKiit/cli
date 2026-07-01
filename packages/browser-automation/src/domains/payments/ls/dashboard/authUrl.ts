/** App routes that require a signed-in Lemon Squeezy session. */
export const LS_AUTHENTICATED_URL =
  /app\.lemonsqueezy\.com\/(dashboard|products|settings|orders|stores|subscription)/;

/** URL fragments that indicate the builder is still on a sign-in / OAuth screen. */
export const LS_AUTH_URL_HINT =
  /(login|sign-?in|sign-?up|register|oauth|auth\.lemonsqueezy|\/auth\/|session\/new)/i;

export function isLsAuthenticatedUrl(url: string): boolean {
  return LS_AUTHENTICATED_URL.test(url);
}

export function isLsAuthGateUrl(url: string): boolean {
  if (!url.includes('lemonsqueezy.com')) return false;
  if (isLsAuthenticatedUrl(url)) return false;
  if (LS_AUTH_URL_HINT.test(url)) return true;
  if (/app\.lemonsqueezy\.com\/?(\?|#|$)/.test(url)) return true;
  return false;
}
