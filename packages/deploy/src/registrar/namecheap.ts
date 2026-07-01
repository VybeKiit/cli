import type { NamecheapConfig } from '@vybekiit/core';

export class NamecheapError extends Error {
  readonly statusCode: number;
  readonly responseBody: string;

  constructor(
    message: string,
    statusCode: number,
    responseBody: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'NamecheapError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

/** Split `example.com` → `{ sld: 'example', tld: 'com' }`. */
export function parseNamecheapDomain(fqdn: string): { sld: string; tld: string } {
  const normalized = fqdn.trim().toLowerCase();
  const dot = normalized.indexOf('.');
  if (dot <= 0 || dot === normalized.length - 1) {
    throw new NamecheapError(`Invalid domain for Namecheap API: ${fqdn}`, 0, '');
  }
  return {
    sld: normalized.slice(0, dot),
    tld: normalized.slice(dot + 1),
  };
}

function apiBaseUrl(sandbox?: boolean): string {
  return sandbox
    ? 'https://api.sandbox.namecheap.com/xml.response'
    : 'https://api.namecheap.com/xml.response';
}

function firstErrorMessage(xml: string): string | null {
  const match = xml.match(/<Error Number="\d+">([^<]*)<\/Error>/);
  return match?.[1]?.trim() ?? null;
}

function assertOk(body: string, status: number): void {
  if (!body.includes('Status="OK"')) {
    const detail = firstErrorMessage(body) ?? 'Namecheap API returned an error';
    throw new NamecheapError(detail, status, body);
  }
}

async function fetchNamecheap(
  config: NamecheapConfig,
  params: Record<string, string>,
): Promise<string> {
  const apiUser = config.NAMECHEAP_API_USER;
  const apiKey = config.NAMECHEAP_API_KEY;
  const clientIp = config.NAMECHEAP_CLIENT_IP;
  if (!(apiUser && apiKey && clientIp)) {
    throw new NamecheapError('Namecheap API is not fully configured', 0, '');
  }

  const search = new URLSearchParams({
    ApiUser: apiUser,
    ApiKey: apiKey,
    UserName: config.NAMECHEAP_USERNAME ?? apiUser,
    ClientIp: clientIp,
    ...params,
  });
  const url = `${apiBaseUrl(config.NAMECHEAP_SANDBOX)}?${search.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new NamecheapError('Namecheap API request failed', 0, '', { cause });
  }
  const body = await response.text();
  if (!response.ok) {
    throw new NamecheapError(`Namecheap API HTTP ${response.status}`, response.status, body);
  }
  return body;
}

/** Verifies credentials via `namecheap.users.getBalances`. */
export async function verifyNamecheapCredentials(config: NamecheapConfig): Promise<void> {
  const body = await fetchNamecheap(config, { Command: 'namecheap.users.getBalances' });
  assertOk(body, 200);
}

/**
 * Sets custom nameservers on a domain registered at Namecheap
 * (`namecheap.domains.dns.setCustom`).
 */
export async function setCustomNameservers(
  domain: string,
  nameservers: string[],
  config: NamecheapConfig,
): Promise<void> {
  const cleaned = nameservers.map((ns) => ns.trim().toLowerCase()).filter(Boolean);
  if (cleaned.length < 2) {
    throw new NamecheapError('At least two nameservers are required', 0, '');
  }

  const { sld, tld } = parseNamecheapDomain(domain);
  const body = await fetchNamecheap(config, {
    Command: 'namecheap.domains.dns.setCustom',
    SLD: sld,
    TLD: tld,
    Nameservers: cleaned.join(','),
  });
  assertOk(body, 200);
  if (!(body.includes('Updated="true"') || body.includes('Updated="True"'))) {
    throw new NamecheapError('Namecheap did not confirm nameserver update', 200, body);
  }
}
