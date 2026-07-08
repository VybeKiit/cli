import type { CloudflareConfig } from '@vybekiit/core';
import { caughtMessage, deployError, failDeploy } from '@vybekiit/deploy/deployEffect';
import type { DeployError } from '@vybekiit/deploy/types';
import { Effect } from 'effect';

export type CloudflareZone = {
  readonly zoneId: string;
  readonly nameservers: string[];
  readonly status: string;
};

type RawZone = {
  readonly id: string;
  readonly status?: string;
  readonly name_servers?: string[];
};

type CloudflareApiResponse<T> = {
  readonly success: boolean;
  readonly result: T;
  readonly errors?: readonly { readonly message: string }[];
};

/**
 * Normalize a Cloudflare API zone into the deploy package shape.
 *
 * @param raw - Raw zone returned by Cloudflare.
 * @returns Normalized zone details.
 * @example
 * const zone = toZone(raw);
 */
const toZone = (raw: RawZone): CloudflareZone => {
  const nameservers = raw.name_servers === undefined ? [] : raw.name_servers;
  const status = raw.status === undefined ? 'pending' : raw.status;
  return {
    zoneId: raw.id,
    nameservers,
    status,
  };
};

/**
 * Read the Cloudflare response error text.
 *
 * @param json - Parsed Cloudflare API envelope.
 * @param response - Fetch response associated with the envelope.
 * @returns Developer-facing error text.
 * @example
 * const message = cloudflareErrorMessage(json, response);
 */
const cloudflareErrorMessage = <T>(json: CloudflareApiResponse<T>, response: Response): string => {
  const messages = json.errors === undefined ? [] : json.errors.map((error) => error.message);
  if (messages.length === 0) {
    return response.statusText;
  }

  return messages.join('; ');
};

/**
 * Fetch and unwrap a Cloudflare API result.
 *
 * @param config - Cloudflare API config.
 * @param path - API path under `/client/v4`.
 * @param init - Optional fetch init merged into the request.
 * @returns An Effect containing the parsed Cloudflare `result` payload.
 * @example
 * const zones = await Effect.runPromise(cloudflareFetch<RawZone[]>(config, '/zones'));
 */
const cloudflareFetch = <T>(
  config: CloudflareConfig,
  path: string,
  init: RequestInit = {},
): Effect.Effect<T, DeployError> =>
  Effect.gen(function* () {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${config.CLOUDFLARE_API_TOKEN}`);
    headers.set('Content-Type', 'application/json');

    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`https://api.cloudflare.com/client/v4${path}`, {
          ...init,
          headers,
        }),
      catch: (caught) =>
        deployError(
          'cloudflare_request_failed',
          `Cloudflare API request failed: ${caughtMessage(caught, 'unknown network error')}`,
        ),
    });
    const json = yield* Effect.tryPromise({
      try: () => response.json() as Promise<CloudflareApiResponse<T>>,
      catch: () => deployError('cloudflare_invalid_response', 'Cloudflare returned invalid JSON.'),
    });
    if (!json.success) {
      return yield* failDeploy('cloudflare_api_error', cloudflareErrorMessage(json, response));
    }
    return json.result;
  });

/**
 * Find an existing zone by domain name, or create a full-setup zone.
 *
 * @param config - Cloudflare API config.
 * @param domainName - Domain name to look up or create.
 * @returns An Effect containing an existing or newly created Cloudflare zone.
 * @example
 * const zone = await Effect.runPromise(getOrCreateZone(config, 'example.com'));
 */
export const getOrCreateZone = (
  config: CloudflareConfig,
  domainName: string,
): Effect.Effect<CloudflareZone, DeployError> =>
  Effect.gen(function* () {
    const normalised = domainName.toLowerCase().trim();
    const existing = yield* cloudflareFetch<RawZone[]>(
      config,
      `/zones?name=${encodeURIComponent(normalised)}`,
    );
    const [zone] = existing;
    if (zone !== undefined) {
      return toZone(zone);
    }
    const created = yield* cloudflareFetch<RawZone>(config, '/zones', {
      method: 'POST',
      body: JSON.stringify({
        name: normalised,
        account: { id: config.CLOUDFLARE_ACCOUNT_ID },
        type: 'full',
      }),
    });
    return toZone(created);
  });
