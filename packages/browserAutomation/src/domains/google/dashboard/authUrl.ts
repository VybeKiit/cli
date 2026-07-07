/** Google sign-in / consent surfaces — presence means the builder still has to authenticate. */
export const GOOGLE_AUTH_URL_HINT = /accounts\.google\.com|\/(?:signin|ServiceLogin|oauth)/i;

/**
 * True when the URL is a signed-in Cloud Console page (not the sign-in flow).
 *
 * @param url - URL to inspect.
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = isGoogleAuthenticatedUrl('https://example.com');
 */
export const isGoogleAuthenticatedUrl = (url: string): boolean => {
  if (!url.includes('console.cloud.google.com')) return false;
  return !GOOGLE_AUTH_URL_HINT.test(url);
};
