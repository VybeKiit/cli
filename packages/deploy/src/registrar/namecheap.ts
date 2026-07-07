import type { NamecheapConfig } from '@vybekiit/core';
import { caughtMessage, deployError, failDeploy } from '@vybekiit/deploy/deployEffect';
import type { DeployError } from '@vybekiit/deploy/types';
import { Effect } from 'effect';

type NamecheapDomainParts = {
  readonly sld: string;
  readonly tld: string;
};

/**
 * Split a fully-qualified domain into Namecheap SLD/TLD parts.
 *
 * @param fqdn - Domain name such as `example.com`.
 * @returns An Effect containing Namecheap domain parts.
 * @example
 * const parts = await Effect.runPromise(parseNamecheapDomain('example.com'));
 */
export const parseNamecheapDomain = (
  fqdn: string,
): Effect.Effect<NamecheapDomainParts, DeployError> => {
  const normalized = fqdn.trim().toLowerCase();
  const dot = normalized.indexOf('.');
  if (dot <= 0 || dot === normalized.length - 1) {
    return failDeploy('namecheap_domain_invalid', `Invalid domain for Namecheap API: ${fqdn}`);
  }
  return Effect.succeed({
    sld: normalized.slice(0, dot),
    tld: normalized.slice(dot + 1),
  });
};

/**
 * Resolve the Namecheap API endpoint for live or sandbox mode.
 *
 * @param sandbox - Whether to use the sandbox endpoint.
 * @returns Base Namecheap API URL.
 * @example
 * const url = apiBaseUrl(true);
 */
const apiBaseUrl = (sandbox?: boolean): string => {
  if (sandbox === true) {
    return 'https://api.sandbox.namecheap.com/xml.response';
  }
  return 'https://api.namecheap.com/xml.response';
};

// '<Error Number="2019166">Bad key</Error>' -> 'Bad key'
const NAMECHEAP_ERROR_PATTERN = /<Error Number="\d+">([^<]*)<\/Error>/;

/**
 * Extract the first Namecheap XML error message.
 *
 * @param xml - XML response body.
 * @returns Error message, or `null` when no error node exists.
 * @example
 * const message = firstErrorMessage(xml);
 */
const firstErrorMessage = (xml: string): string | null => {
  const match = xml.match(NAMECHEAP_ERROR_PATTERN);
  if (match === null) {
    return null;
  }
  const [, message] = match;
  if (message === undefined) {
    return null;
  }
  return message.trim();
};

/**
 * Assert that a Namecheap XML response reports success.
 *
 * @param body - XML response body.
 * @param status - HTTP status code associated with the body.
 * @returns An Effect that succeeds when the body reports success.
 * @example
 * await Effect.runPromise(assertOk(body, response.status));
 */
const assertOk = (body: string, status: number): Effect.Effect<void, DeployError> => {
  if (!body.includes('Status="OK"')) {
    const errorMessage = firstErrorMessage(body);
    const detail = errorMessage === null ? 'Namecheap API returned an error' : errorMessage;
    return failDeploy('namecheap_api_error', `${detail}: ${status}`);
  }

  return Effect.void;
};

/**
 * Build Namecheap auth query parameters.
 *
 * @param config - Namecheap API config.
 * @returns An Effect containing required auth query parameters.
 * @example
 * const auth = await Effect.runPromise(namecheapAuthParams(config));
 */
const namecheapAuthParams = (
  config: NamecheapConfig,
): Effect.Effect<Record<string, string>, DeployError> => {
  const apiUser = config.NAMECHEAP_API_USER;
  const apiKey = config.NAMECHEAP_API_KEY;
  const clientIp = config.NAMECHEAP_CLIENT_IP;
  if (apiUser === undefined || apiKey === undefined || clientIp === undefined) {
    return failDeploy('namecheap_config_missing', 'Namecheap API is not fully configured');
  }
  const username = config.NAMECHEAP_USERNAME === undefined ? apiUser : config.NAMECHEAP_USERNAME;

  return Effect.succeed({
    ApiUser: apiUser,
    ApiKey: apiKey,
    UserName: username,
    ClientIp: clientIp,
  });
};

/**
 * Call the Namecheap XML API with validated auth parameters.
 *
 * @param config - Namecheap API config.
 * @param params - Query parameters for the command.
 * @returns An Effect containing raw XML response body.
 * @example
 * const body = await Effect.runPromise(fetchNamecheap(config, { Command: 'namecheap.users.getBalances' }));
 */
const fetchNamecheap = (
  config: NamecheapConfig,
  params: Record<string, string>,
): Effect.Effect<string, DeployError> =>
  Effect.gen(function* () {
    const auth = yield* namecheapAuthParams(config);
    const search = new URLSearchParams({
      ...auth,
      ...params,
    });
    const url = `${apiBaseUrl(config.NAMECHEAP_SANDBOX)}?${search.toString()}`;

    const response = yield* Effect.tryPromise({
      try: () => fetch(url),
      catch: (caught) =>
        deployError(
          'namecheap_request_failed',
          `Namecheap API request failed: ${caughtMessage(caught, 'unknown network error')}`,
        ),
    });
    const body = yield* Effect.tryPromise({
      try: () => response.text(),
      catch: () =>
        deployError('namecheap_invalid_response', 'Namecheap response could not be read.'),
    });
    if (!response.ok) {
      return yield* failDeploy(
        'namecheap_http_error',
        `Namecheap API HTTP ${response.status}: ${body}`,
      );
    }
    return body;
  });

/**
 * Verify Namecheap credentials via `namecheap.users.getBalances`.
 *
 * @param config - Namecheap API config.
 * @returns An Effect that succeeds when credentials are accepted.
 * @example
 * await Effect.runPromise(verifyNamecheapCredentials(config));
 */
export const verifyNamecheapCredentials = (
  config: NamecheapConfig,
): Effect.Effect<void, DeployError> =>
  Effect.gen(function* () {
    const body = yield* fetchNamecheap(config, { Command: 'namecheap.users.getBalances' });
    yield* assertOk(body, 200);
  });

/**
 * Sets custom nameservers on a domain registered at Namecheap
 * (`namecheap.domains.dns.setCustom`).
 *
 * @param domain - Domain registered at Namecheap.
 * @param nameservers - Nameservers to assign.
 * @param config - Namecheap API config.
 * @returns An Effect that succeeds after Namecheap confirms the update.
 * @example
 * await Effect.runPromise(setCustomNameservers('example.com', ['ns1.example.net', 'ns2.example.net'], config));
 */
export const setCustomNameservers = (
  domain: string,
  nameservers: string[],
  config: NamecheapConfig,
): Effect.Effect<void, DeployError> =>
  Effect.gen(function* () {
    const cleaned = nameservers
      .map((ns) => ns.trim().toLowerCase())
      .filter((nameserver) => nameserver.length > 0);
    if (cleaned.length < 2) {
      return yield* failDeploy('invalid_nameservers', 'At least two nameservers are required');
    }

    const { sld, tld } = yield* parseNamecheapDomain(domain);
    const body = yield* fetchNamecheap(config, {
      Command: 'namecheap.domains.dns.setCustom',
      SLD: sld,
      TLD: tld,
      Nameservers: cleaned.join(','),
    });
    yield* assertOk(body, 200);
    const updated = body.includes('Updated="true"') || body.includes('Updated="True"');
    if (updated === false) {
      return yield* failDeploy(
        'namecheap_update_unconfirmed',
        'Namecheap did not confirm nameserver update',
      );
    }
  });
