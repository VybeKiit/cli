/**
 * Parse GoDaddy API key from developer portal HTML.
 *
 * @param html - HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeGodaddyApiKey(html);
 */
export const scrapeGodaddyApiKey = (html: string): string | null => {
  const byName = html.match(
    /<input[^>]*(?:name|id)=["'][^"']*api[^"']*key[^"']*["'][^>]*value=["']([A-Za-z0-9_-]{20,})["']/i,
  )?.[1];
  if (byName) return byName;

  const byReadonly = html.match(
    /<input[^>]*readonly[^>]*value=["']([A-Za-z0-9_-]{20,})["'][^>]*>/i,
  )?.[1];
  if (byReadonly) return byReadonly;

  const [keySection = html] = html.split(/secret/i);
  const keyBlock = keySection.match(
    /api\s*key[\s\S]{0,400}?value=["']([A-Za-z0-9_-]{20,})["']/i,
  )?.[1];
  if (keyBlock) return keyBlock;

  const textBlock = html.match(/>\s*([A-Za-z0-9_-]{20,})\s*<\/(?:code|span|p|div|td)>/i);
  if (textBlock?.[1] !== undefined) return textBlock[1];

  const labeled = html.match(/Key[\s\S]{0,120}?([A-Za-z0-9_-]{20,})/i);
  return labeled?.[1] === undefined ? null : labeled[1];
};

/**
 * Parse GoDaddy API secret from developer portal HTML.
 *
 * @param html - HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeGodaddyApiSecret(html);
 */
export const scrapeGodaddyApiSecret = (html: string): string | null => {
  const byName = html.match(
    /<input[^>]*(?:name|id)=["'][^"']*secret[^"']*["'][^>]*value=["']([A-Za-z0-9_-]{20,})["']/i,
  )?.[1];
  if (byName) return byName;

  const secretBlock = html.match(/secret[\s\S]{0,400}?value=["']([A-Za-z0-9_-]{20,})["']/i)?.[1];
  if (secretBlock) return secretBlock;

  const afterSecret = html
    .split(/secret/i)
    .slice(1)
    .join('secret');
  const textBlock = afterSecret.match(/>\s*([A-Za-z0-9_-]{20,})\s*<\/(?:code|span|p|div|td)>/i);
  if (textBlock?.[1] !== undefined) return textBlock[1];

  const labeled = afterSecret.match(/Secret[\s\S]{0,120}?([A-Za-z0-9_-]{20,})/i);
  return labeled?.[1] === undefined ? null : labeled[1];
};

/**
 * Keys already listed on the developer portal (secret is not shown for existing keys).
 *
 * @param html - HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeGodaddyKeysFromList(html);
 */
export const scrapeGodaddyKeysFromList = (html: string): string[] => {
  const keys = new Set<string>();
  // grab a 20+ char key from an input value: `value="Ab_3...xy"` → "Ab_3...xy"
  for (const match of html.matchAll(/value=["']([A-Za-z0-9_-]{20,})["']/gi)) {
    keys.add(match[1]!);
  }
  // grab a 20+ char key shown as cell/code text: `<td> Ab_3...xy </td>` → "Ab_3...xy"
  for (const match of html.matchAll(/>\s*([A-Za-z0-9_-]{20,})\s*<\/(?:code|span|td)/gi)) {
    keys.add(match[1]!);
  }
  return [...keys];
};

/**
 * Parse key/secret pair from a one-time reveal dialog block.
 *
 * @param html - HTML source to inspect.
 * @returns Scraped value, or `null` when the source does not contain it.
 * @example
 * const result = scrapeGodaddyKeyPair(html);
 */
export const scrapeGodaddyKeyPair = (
  html: string,
): { apiKey: string; apiSecret: string } | null => {
  const apiKey = scrapeGodaddyApiKey(html);
  const apiSecret = scrapeGodaddyApiSecret(html);
  if (apiKey && apiSecret) return { apiKey, apiSecret };
  return null;
};
