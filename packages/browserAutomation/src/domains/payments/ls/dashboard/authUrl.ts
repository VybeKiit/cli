/** App routes that require a signed-in Lemon Squeezy session. */
export const LS_AUTHENTICATED_URL =
  /app\.lemonsqueezy\.com\/(dashboard|products|settings|orders|stores|subscription)/;

/** URL fragments that indicate the builder is still on a sign-in / OAuth screen. */
export const LS_AUTH_URL_HINT =
  /(login|sign-?in|sign-?up|register|oauth|auth\.lemonsqueezy|\/auth\/|session\/new)/i;

// `https://app.lemonsqueezy.com` -> match.
const LS_APP_ROOT_URL_PATTERN = /app\.lemonsqueezy\.com\/?(\?|#|$)/;

/**
 * Check whether a URL is a signed-in Lemon Squeezy app route.
 *
 * @param url - Browser URL to classify.
 * @returns True when the URL points to a signed-in dashboard route.
 * @example
 * const ready = isLsAuthenticatedUrl('https://app.lemonsqueezy.com/dashboard');
 */
export const isLsAuthenticatedUrl = (url: string): boolean => LS_AUTHENTICATED_URL.test(url);

/**
 * Check whether a URL still looks like a Lemon Squeezy login gate.
 *
 * @param url - Browser URL to classify.
 * @returns True when the URL is a login, auth, or app-root holding page.
 * @example
 * const gated = isLsAuthGateUrl('https://app.lemonsqueezy.com/login');
 */
export const isLsAuthGateUrl = (url: string): boolean => {
  if (!url.includes('lemonsqueezy.com')) {
    return false;
  }
  if (isLsAuthenticatedUrl(url)) {
    return false;
  }
  if (LS_AUTH_URL_HINT.test(url)) {
    return true;
  }
  if (LS_APP_ROOT_URL_PATTERN.test(url)) {
    return true;
  }
  return false;
};
