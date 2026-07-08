/** A Google OAuth client ID: `1234567890-abc123.apps.googleusercontent.com`. */
const CLIENT_ID_RE = /\b\d{6,}-[a-z0-9]+\.apps\.googleusercontent\.com\b/i;

/** A Google OAuth client secret always begins `GOCSPX-`. */
const CLIENT_SECRET_RE = /\bGOCSPX-[A-Za-z0-9_-]{10,}\b/;

/**
 * Parse the OAuth client ID from the credentials dialog/page HTML.
 *
 * @param html - HTML source to inspect.
 * @returns Parsed value for downstream automation.
 * @example
 * const result = parseClientId(html);
 */
export const parseClientId = (html: string): string | null => {
  const match = html.match(CLIENT_ID_RE);
  return match === null ? null : match[0];
};

/**
 * Parse the OAuth client secret from the credentials dialog/page HTML.
 *
 * @param html - HTML source to inspect.
 * @returns Parsed value for downstream automation.
 * @example
 * const result = parseClientSecret(html);
 */
export const parseClientSecret = (html: string): string | null => {
  const match = html.match(CLIENT_SECRET_RE);
  return match === null ? null : match[0];
};

/**
 * True when a string is a well-formed OAuth client ID.
 *
 * @param value - Value to print or validate.
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = isValidClientId(value);
 */
export const isValidClientId = (value: string): boolean => {
  // 1234-abc.apps.googleusercontent.com → match; foo → no match
  return new RegExp(`^${CLIENT_ID_RE.source}$`, 'i').test(value.trim());
};

/**
 * True when a string is a well-formed OAuth client secret.
 *
 * @param value - Value to print or validate.
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = isValidClientSecret(value);
 */
export const isValidClientSecret = (value: string): boolean => {
  // GOCSPX-aBc123_defG → match; secret → no match
  return new RegExp(`^${CLIENT_SECRET_RE.source}$`).test(value.trim());
};

/**
 * Structural check on scraped credentials (no live API call — Google offers none cheaply).
 *
 * @param clientId - Provider client id to inspect.
 * @param clientSecret - Input value for clientSecret.
 * @returns Computed value for downstream automation.
 * @example
 * const result = validateGoogleCredentials('client-id', clientSecret);
 */
export const validateGoogleCredentials = (clientId: string, clientSecret: string): boolean =>
  isValidClientId(clientId) && isValidClientSecret(clientSecret);
