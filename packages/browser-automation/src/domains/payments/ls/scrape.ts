/** Scrape Lemon Squeezy IDs embedded in dashboard HTML (passive read). */
export function scrapeStoreIdFromHtml(html: string): string | null {
  const match =
    html.match(/"store_id"\s*:\s*"?(\d+)"?/) ??
    html.match(/store_id(?:&quot;|")\s*:\s*(\d+)/) ??
    html.match(/"storeId"\s*:\s*"?(\d+)"?/);
  return match?.[1] ?? null;
}

export function scrapeVariantIdFromHtml(html: string): string | null {
  const match =
    html.match(/"variant_id"\s*:\s*"?(\d+)"?/) ??
    html.match(/variant_id(?:&quot;|")\s*:\s*(\d+)/) ??
    html.match(/"variantId"\s*:\s*"?(\d+)"?/);
  return match?.[1] ?? null;
}

export function scrapeProductIdFromUrl(url: string): string | null {
  return url.match(/\/products\/(\d+)/)?.[1] ?? null;
}

/** LS shows the API key once in a readonly field or JWT-shaped token after create. */
export function scrapeApiKeyFromHtml(html: string): string | null {
  const jwt = html.match(/(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  if (jwt?.[1]) return jwt[1];

  const quoted = html.match(/"api_key"\s*:\s*"([^"]+)"/);
  if (quoted?.[1]) return quoted[1];

  return null;
}

export function formatPriceFromCents(priceCents: number): string {
  return (priceCents / 100).toFixed(2);
}
