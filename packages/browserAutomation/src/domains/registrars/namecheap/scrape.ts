/**
 * Parse Namecheap API key and username from dashboard HTML.
 *
 * @param html - HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeNamecheapApiKey(html);
 */
export const scrapeNamecheapApiKey = (html: string): string | null => {
  const labeled = html.match(/api\s*key[^>]*>[\s\S]{0,400}?([a-f0-9]{32,})/i);
  if (labeled?.[1] !== undefined) return labeled[1];

  const apiKey = html.match(/ApiKey[^>]*>([a-f0-9]{32,})/i);
  if (apiKey?.[1] !== undefined) return apiKey[1];

  const inputMatch = html.match(
    /<input[^>]*(?:name|id)=["'][^"']*api[^"']*key[^"']*["'][^>]*value=["']([a-f0-9]{32,})["']/i,
  )?.[1];
  if (inputMatch !== undefined) return inputMatch;

  const generic = html.match(/\b([a-f0-9]{32,40})\b/g);
  if (!generic) return null;
  for (const candidate of generic) {
    if (candidate.length >= 32 && candidate.length <= 40) return candidate;
  }
  return null;
};

/**
 * Parse Namecheap API username from dashboard HTML.
 *
 * @param html - HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeNamecheapApiUser(html);
 */
export const scrapeNamecheapApiUser = (html: string): string | null => {
  const labeled = html.match(/api\s*user[^>]*>[\s\S]{0,200}?([a-z0-9_-]{3,32})/i);
  if (labeled?.[1] !== undefined) return labeled[1].toLowerCase();

  const apiUser = html.match(/ApiUser[^>]*>([a-z0-9_-]{3,32})/i);
  if (apiUser?.[1] !== undefined) return apiUser[1].toLowerCase();

  const inputMatch = html.match(
    /<input[^>]*(?:name|id)=["'][^"']*api[^"']*user[^"']*["'][^>]*value=["']([^"']+)["']/i,
  )?.[1];
  if (inputMatch === undefined) return null;
  return inputMatch.trim().toLowerCase();
};

/**
 * True when HTML indicates the IP is already whitelisted.
 *
 * @param html - HTML source to inspect.
 * @param ip - Input value for ip.
 * @returns Whether the inspected value matches the expected state.
 * @example
 * const result = htmlContainsWhitelistedIp(html, ip);
 */
export const htmlContainsWhitelistedIp = (html: string, ip: string): boolean => html.includes(ip);
