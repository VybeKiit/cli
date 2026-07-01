import type { GodaddyConfig } from '@vybekiit/core';

export class GodaddyError extends Error {
  readonly statusCode: number;
  readonly responseBody: string;

  constructor(
    message: string,
    statusCode: number,
    responseBody: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'GodaddyError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

function apiBaseUrl(ote?: boolean): string {
  return ote ? 'https://api.ote-godaddy.com' : 'https://api.godaddy.com';
}

function authHeader(config: GodaddyConfig): string {
  const apiKey = config.GODADDY_API_KEY;
  const apiSecret = config.GODADDY_API_SECRET;
  if (!(apiKey && apiSecret)) {
    throw new GodaddyError('GoDaddy API is not fully configured', 0, '');
  }
  return `sso-key ${apiKey}:${apiSecret}`;
}

async function fetchGodaddy(
  config: GodaddyConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl(config.GODADDY_OTE)}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader(config),
        Accept: 'application/json',
        ...init?.headers,
      },
    });
  } catch (cause) {
    throw new GodaddyError('GoDaddy API request failed', 0, '', { cause });
  }
  return response;
}

/** Verifies credentials via `GET /v1/domains?limit=1`. */
export async function verifyGodaddyCredentials(config: GodaddyConfig): Promise<void> {
  const response = await fetchGodaddy(config, '/v1/domains?limit=1');
  const body = await response.text();
  if (!response.ok) {
    throw new GodaddyError(`GoDaddy API HTTP ${response.status}`, response.status, body);
  }
}

/**
 * Sets custom nameservers on a domain registered at GoDaddy
 * (`PATCH /v1/domains/{domain}`).
 */
export async function setGodaddyNameservers(
  domain: string,
  nameservers: string[],
  config: GodaddyConfig,
): Promise<void> {
  const cleaned = nameservers.map((ns) => ns.trim().toLowerCase()).filter(Boolean);
  if (cleaned.length < 2) {
    throw new GodaddyError('At least two nameservers are required', 0, '');
  }

  const response = await fetchGodaddy(config, `/v1/domains/${encodeURIComponent(domain)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nameServers: cleaned }),
  });
  const body = await response.text();
  if (!response.ok) {
    throw new GodaddyError(`GoDaddy API HTTP ${response.status}`, response.status, body);
  }
}
