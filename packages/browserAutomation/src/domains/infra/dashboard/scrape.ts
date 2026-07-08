/**
 * Passive scrapers for the Cloudflare "Token created successfully" dialog.
 *
 * The token value is shown exactly once (`cfat_...`); the account id is the 32-hex value
 * present in the dialog and the dashboard URL. Both are read from HTML/text, never typed
 * back to the agent transcript.
 */

/**
 * Match a Cloudflare API token — `cfat_` prefix followed by the base62 body.
 *
 * @param html - HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeCfTokenFromHtml(html);
 */
export const scrapeCfTokenFromHtml = (html: string): string | null => {
  const match = html.match(/cfat_[A-Za-z0-9_-]{20,}/);
  return match === null ? null : match[0];
};

/**
 * Match the 32-hex Cloudflare account id from a URL or page HTML.
 *
 * @param urlOrHtml - URL or HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeCfAccountIdFromUrl('https://example.com');
 */
export const scrapeCfAccountIdFromUrl = (urlOrHtml: string): string | null => {
  const match = urlOrHtml.match(/[0-9a-f]{32}/i);
  return match === null ? null : match[0];
};
