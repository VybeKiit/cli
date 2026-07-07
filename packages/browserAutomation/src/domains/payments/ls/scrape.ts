// `"store_id":"123"` -> 123
const JSON_STORE_ID_PATTERN = /"store_id"\s*:\s*"?(\d+)"?/;
// `store_id&quot;:123` -> 123
const HTML_STORE_ID_PATTERN = /store_id(?:&quot;|")\s*:\s*(\d+)/;
// `"storeId":"123"` -> 123
const CAMEL_STORE_ID_PATTERN = /"storeId"\s*:\s*"?(\d+)"?/;
// `"variant_id":"456"` -> 456
const JSON_VARIANT_ID_PATTERN = /"variant_id"\s*:\s*"?(\d+)"?/;
// `variant_id&quot;:456` -> 456
const HTML_VARIANT_ID_PATTERN = /variant_id(?:&quot;|")\s*:\s*(\d+)/;
// `"variantId":"456"` -> 456
const CAMEL_VARIANT_ID_PATTERN = /"variantId"\s*:\s*"?(\d+)"?/;
// `/products/123/edit` -> 123
const PRODUCT_ID_URL_PATTERN = /\/products\/(\d+)/;
// `eyJ...payload...sig` -> full token
const JWT_TOKEN_PATTERN = /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/;
// `"api_key":"ls_live_..."` -> ls_live_...
const API_KEY_JSON_PATTERN = /"api_key"\s*:\s*"([^"]+)"/;

/**
 * Read the first capture group from a regex match.
 *
 * @param match - Regex match result.
 * @returns First capture value, or null when absent.
 * @example
 * const id = readFirstCapture('"id":"123"'.match(/"id":"(\d+)"/));
 */
const readFirstCapture = (match: RegExpMatchArray | null): string | null => {
  if (match === null) {
    return null;
  }

  const [, capture] = match;
  if (capture === undefined) {
    return null;
  }

  return capture;
};

/**
 * Return the first captured value from the provided regex patterns.
 *
 * @param html - HTML or serialized dashboard state to inspect.
 * @param patterns - Ordered patterns to try.
 * @returns First captured value, or null when no pattern matches.
 * @example
 * const id = readFirstPatternCapture(html, [JSON_STORE_ID_PATTERN]);
 */
const readFirstPatternCapture = (html: string, patterns: readonly RegExp[]): string | null => {
  for (const pattern of patterns) {
    const capture = readFirstCapture(html.match(pattern));
    if (capture !== null) {
      return capture;
    }
  }

  return null;
};

/**
 * Build product-scoped variant id patterns for dashboard state blobs.
 *
 * @param productId - Product id that should appear near the variant id.
 * @returns Ordered patterns for product-scoped variant lookup.
 * @example
 * const patterns = productScopedVariantPatterns('123');
 */
const productScopedVariantPatterns = (productId: string): readonly RegExp[] => {
  // `"id":"123" ... "variant_id":"456"` -> 456
  const productThenVariantPattern = new RegExp(
    `"id"\\s*:\\s*"${productId}"[\\s\\S]{0,4000}?"variant_id"\\s*:\\s*"?([0-9]+)"?`,
  );
  // `"product_id":"123" ... "id":"456"` -> 456
  const variantRecordPattern = new RegExp(
    `"product_id"\\s*:\\s*"?${productId}"?[\\s\\S]{0,2000}?"id"\\s*:\\s*"([0-9]+)"`,
  );

  return [productThenVariantPattern, variantRecordPattern];
};

/**
 * Scrape a Lemon Squeezy store id embedded in dashboard HTML.
 *
 * @param html - Dashboard HTML or serialized state.
 * @returns Store id when found, otherwise null.
 * @example
 * const storeId = scrapeStoreIdFromHtml(html);
 */
export const scrapeStoreIdFromHtml = (html: string): string | null =>
  readFirstPatternCapture(html, [
    JSON_STORE_ID_PATTERN,
    HTML_STORE_ID_PATTERN,
    CAMEL_STORE_ID_PATTERN,
  ]);

/**
 * Scrape a Lemon Squeezy variant id embedded in dashboard HTML.
 *
 * @param html - Dashboard HTML or serialized state.
 * @param productId - Optional product id used to scope the search.
 * @returns Variant id when found, otherwise null.
 * @example
 * const variantId = scrapeVariantIdFromHtml(html, '123');
 */
export const scrapeVariantIdFromHtml = (html: string, productId?: string): string | null => {
  if (productId !== undefined) {
    const scopedVariantId = readFirstPatternCapture(html, productScopedVariantPatterns(productId));
    if (scopedVariantId !== null) {
      return scopedVariantId;
    }
  }

  return readFirstPatternCapture(html, [
    JSON_VARIANT_ID_PATTERN,
    HTML_VARIANT_ID_PATTERN,
    CAMEL_VARIANT_ID_PATTERN,
  ]);
};

/**
 * Scrape a Lemon Squeezy product id from a dashboard URL.
 *
 * @param url - Dashboard URL to inspect.
 * @returns Product id when the URL contains one, otherwise null.
 * @example
 * const productId = scrapeProductIdFromUrl('https://app.lemonsqueezy.com/products/123/edit');
 */
export const scrapeProductIdFromUrl = (url: string): string | null =>
  readFirstCapture(url.match(PRODUCT_ID_URL_PATTERN));

/**
 * Scrape the one-time Lemon Squeezy API key value after creation.
 *
 * @param html - Dialog HTML shown after API key creation.
 * @returns API key token when present, otherwise null.
 * @example
 * const apiKey = scrapeApiKeyFromHtml(await page.content());
 */
export const scrapeApiKeyFromHtml = (html: string): string | null => {
  const jwt = readFirstCapture(html.match(JWT_TOKEN_PATTERN));
  if (jwt !== null) {
    return jwt;
  }

  return readFirstCapture(html.match(API_KEY_JSON_PATTERN));
};

/**
 * Format a cent amount for Lemon Squeezy price fields.
 *
 * @param priceCents - Price in cents.
 * @returns Decimal price string.
 * @example
 * const price = formatPriceFromCents(2900);
 */
export const formatPriceFromCents = (priceCents: number): string => (priceCents / 100).toFixed(2);
