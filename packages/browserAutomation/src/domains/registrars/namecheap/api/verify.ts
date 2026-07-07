import type { NcSetupResult } from '@vybekiit/browser-automation/domains/registrars/namecheap/types';
import { verifyNamecheapCredentials } from '@vybekiit/deploy';
import { Effect } from 'effect';

/**
 * Validates scraped Namecheap credentials against the live API.
 *
 * @param result - Operation result to convert.
 * @returns Promise resolving with the verification result.
 * @example
 * const result = await verifyNcCredentialsViaApi(result);
 */
export const verifyNcCredentialsViaApi = async (result: NcSetupResult): Promise<void> => {
  await Effect.runPromise(
    verifyNamecheapCredentials({
      NAMECHEAP_API_USER: result.apiUser,
      NAMECHEAP_API_KEY: result.apiKey,
      NAMECHEAP_CLIENT_IP: result.clientIp,
      NAMECHEAP_SANDBOX: result.sandbox,
    }),
  );
};
