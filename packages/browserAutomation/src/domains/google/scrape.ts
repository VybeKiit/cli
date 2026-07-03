/** A Google OAuth client ID: `1234567890-abc123.apps.googleusercontent.com`. */
const CLIENT_ID_RE = /\b\d{6,}-[a-z0-9]+\.apps\.googleusercontent\.com\b/i;

/** A Google OAuth client secret always begins `GOCSPX-`. */
const CLIENT_SECRET_RE = /\bGOCSPX-[A-Za-z0-9_-]{10,}\b/;

/** Parse the OAuth client ID from the credentials dialog/page HTML. */
export function parseClientId(html: string): string | null {
  return html.match(CLIENT_ID_RE)?.[0] ?? null;
}

/** Parse the OAuth client secret from the credentials dialog/page HTML. */
export function parseClientSecret(html: string): string | null {
  return html.match(CLIENT_SECRET_RE)?.[0] ?? null;
}

/** True when a string is a well-formed OAuth client ID. */
export function isValidClientId(value: string): boolean {
  // 1234-abc.apps.googleusercontent.com → match; foo → no match
  return new RegExp(`^${CLIENT_ID_RE.source}$`, 'i').test(value.trim());
}

/** True when a string is a well-formed OAuth client secret. */
export function isValidClientSecret(value: string): boolean {
  // GOCSPX-aBc123_defG → match; secret → no match
  return new RegExp(`^${CLIENT_SECRET_RE.source}$`).test(value.trim());
}

/** Structural check on scraped credentials (no live API call — Google offers none cheaply). */
export function validateGoogleCredentials(clientId: string, clientSecret: string): boolean {
  return isValidClientId(clientId) && isValidClientSecret(clientSecret);
}
