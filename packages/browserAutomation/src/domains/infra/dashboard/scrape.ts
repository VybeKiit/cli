/**
 * Passive scrapers for the Cloudflare "Token created successfully" dialog.
 *
 * The token value is shown exactly once (`cfat_...`); the account id is the 32-hex value
 * present in the dialog and the dashboard URL. Both are read from HTML/text, never typed
 * back to the agent transcript.
 */

/** Match a Cloudflare API token — `cfat_` prefix followed by the base62 body. */
export function scrapeCfTokenFromHtml(html: string): string | null {
  return html.match(/cfat_[A-Za-z0-9]{20,}/)?.[0] ?? null;
}

/** Match the 32-hex Cloudflare account id from a URL or page HTML. */
export function scrapeCfAccountIdFromUrl(urlOrHtml: string): string | null {
  return urlOrHtml.match(/[0-9a-f]{32}/i)?.[0] ?? null;
}
