/** Parse Namecheap API key and username from dashboard HTML. */
export function scrapeNamecheapApiKey(html: string): string | null {
  const labeled =
    html.match(/api\s*key[^>]*>[\s\S]{0,400}?([a-f0-9]{32,})/i)?.[1] ??
    html.match(/ApiKey[^>]*>([a-f0-9]{32,})/i)?.[1];
  if (labeled) return labeled;

  const inputMatch = html.match(
    /<input[^>]*(?:name|id)=["'][^"']*api[^"']*key[^"']*["'][^>]*value=["']([a-f0-9]{32,})["']/i,
  )?.[1];
  if (inputMatch) return inputMatch;

  const generic = html.match(/\b([a-f0-9]{32,40})\b/g);
  if (!generic) return null;
  for (const candidate of generic) {
    if (candidate.length >= 32 && candidate.length <= 40) return candidate;
  }
  return null;
}

/** Parse Namecheap API username from dashboard HTML. */
export function scrapeNamecheapApiUser(html: string): string | null {
  const labeled =
    html.match(/api\s*user[^>]*>[\s\S]{0,200}?([a-z0-9_-]{3,32})/i)?.[1] ??
    html.match(/ApiUser[^>]*>([a-z0-9_-]{3,32})/i)?.[1];
  if (labeled) return labeled.toLowerCase();

  const inputMatch = html.match(
    /<input[^>]*(?:name|id)=["'][^"']*api[^"']*user[^"']*["'][^>]*value=["']([^"']+)["']/i,
  )?.[1];
  return inputMatch?.trim().toLowerCase() ?? null;
}

/** True when HTML indicates the IP is already whitelisted. */
export function htmlContainsWhitelistedIp(html: string, ip: string): boolean {
  return html.includes(ip);
}
