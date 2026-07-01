export const GD_AUTHENTICATED_URL = /developer\.godaddy\.com/i;

export const GD_AUTH_URL_HINT =
  /(login|sign-?in|sign-?up|register|oauth|sso|auth|account\.godaddy)/i;

export function isGdAuthenticatedUrl(url: string): boolean {
  if (!url.includes('godaddy.com')) return false;
  if (GD_AUTH_URL_HINT.test(url) && !GD_AUTHENTICATED_URL.test(url)) return false;
  return GD_AUTHENTICATED_URL.test(url);
}
