import type { GodaddyConfig } from '@vybekiit/core';
import { caughtMessage, deployError, failDeploy } from '@vybekiit/deploy/deployEffect';
import type { DeployError } from '@vybekiit/deploy/types';
import { Effect } from 'effect';

/**
 * Resolve the GoDaddy API endpoint for live or OTE mode.
 *
 * @param ote - Whether to use the OTE endpoint.
 * @returns Base GoDaddy API URL.
 * @example
 * const url = apiBaseUrl(true);
 */
const apiBaseUrl = (ote?: boolean): string => {
  if (ote === true) {
    return 'https://api.ote-godaddy.com';
  }
  return 'https://api.godaddy.com';
};

/**
 * Build the GoDaddy authorization header.
 *
 * @param config - GoDaddy API config.
 * @returns An Effect containing the header value for GoDaddy API requests.
 * @example
 * const header = await Effect.runPromise(authHeader(config));
 */
const authHeader = (config: GodaddyConfig): Effect.Effect<string, DeployError> => {
  const apiKey = config.GODADDY_API_KEY;
  const apiSecret = config.GODADDY_API_SECRET;
  if (apiKey === undefined || apiSecret === undefined) {
    return failDeploy('godaddy_config_missing', 'GoDaddy API is not fully configured');
  }
  return Effect.succeed(`sso-key ${apiKey}:${apiSecret}`);
};

/**
 * Call the GoDaddy REST API with auth headers.
 *
 * @param config - GoDaddy API config.
 * @param path - API path to request.
 * @param init - Optional fetch init.
 * @returns An Effect containing the raw fetch response.
 * @example
 * const response = await Effect.runPromise(fetchGodaddy(config, '/v1/domains?limit=1'));
 */
const fetchGodaddy = (
  config: GodaddyConfig,
  path: string,
  init?: RequestInit,
): Effect.Effect<Response, DeployError> =>
  Effect.gen(function* () {
    const headers = new Headers(init === undefined ? undefined : init.headers);
    headers.set('Authorization', yield* authHeader(config));
    headers.set('Accept', 'application/json');
    return yield* Effect.tryPromise({
      try: () =>
        fetch(`${apiBaseUrl(config.GODADDY_OTE)}${path}`, {
          ...init,
          headers,
        }),
      catch: (caught) =>
        deployError(
          'godaddy_request_failed',
          `GoDaddy API request failed: ${caughtMessage(caught, 'unknown network error')}`,
        ),
    });
  });

/**
 * Verify GoDaddy credentials via `GET /v1/domains?limit=1`.
 *
 * @param config - GoDaddy API config.
 * @returns An Effect that succeeds when credentials are accepted.
 * @example
 * await Effect.runPromise(verifyGodaddyCredentials(config));
 */
export const verifyGodaddyCredentials = (config: GodaddyConfig): Effect.Effect<void, DeployError> =>
  Effect.gen(function* () {
    const response = yield* fetchGodaddy(config, '/v1/domains?limit=1');
    const body = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: () => deployError('godaddy_invalid_response', 'GoDaddy response could not be read.'),
    });
    if (!response.ok) {
      return yield* failDeploy(
        'godaddy_http_error',
        `GoDaddy API HTTP ${response.status}: ${body}`,
      );
    }
  });

/**
 * Sets custom nameservers on a domain registered at GoDaddy
 * (`PATCH /v1/domains/{domain}`).
 *
 * @param domain - Domain registered at GoDaddy.
 * @param nameservers - Nameservers to assign.
 * @param config - GoDaddy API config.
 * @returns An Effect that succeeds after GoDaddy accepts the update.
 * @example
 * await Effect.runPromise(setGodaddyNameservers('example.com', ['ns1.example.net', 'ns2.example.net'], config));
 */
export const setGodaddyNameservers = (
  domain: string,
  nameservers: string[],
  config: GodaddyConfig,
): Effect.Effect<void, DeployError> =>
  Effect.gen(function* () {
    const cleaned = nameservers
      .map((ns) => ns.trim().toLowerCase())
      .filter((nameserver) => nameserver.length > 0);
    if (cleaned.length < 2) {
      return yield* failDeploy('invalid_nameservers', 'At least two nameservers are required');
    }

    const response = yield* fetchGodaddy(config, `/v1/domains/${encodeURIComponent(domain)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameServers: cleaned }),
    });
    const body = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: () => deployError('godaddy_invalid_response', 'GoDaddy response could not be read.'),
    });
    if (!response.ok) {
      return yield* failDeploy(
        'godaddy_http_error',
        `GoDaddy API HTTP ${response.status}: ${body}`,
      );
    }
  });
