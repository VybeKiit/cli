export const GD_AUTHENTICATED_URL = /developer\.godaddy\.com/i;

export const GD_AUTH_URL_HINT =
  /(login|sign-?in|sign-?up|register|oauth|sso|auth|account\.godaddy)/i;

/**
 * Is Gd Authenticated Url.
 *
 * @param url - URL to inspect.
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = isGdAuthenticatedUrl('https://example.com');
 */
export const isGdAuthenticatedUrl = (url: string): boolean => {
  if (!url.includes('godaddy.com')) return false;
  if (GD_AUTH_URL_HINT.test(url) && !GD_AUTHENTICATED_URL.test(url)) return false;
  return GD_AUTHENTICATED_URL.test(url);
};
