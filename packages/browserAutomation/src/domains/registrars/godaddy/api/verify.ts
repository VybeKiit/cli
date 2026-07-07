import type { GdSetupResult } from '@vybekiit/browser-automation/domains/registrars/godaddy/types';
import { verifyGodaddyCredentials } from '@vybekiit/deploy';
import { Effect } from 'effect';

/**
 * Validates scraped GoDaddy credentials against the live API.
 *
 * @param result - Operation result to convert.
 * @returns Promise resolving with the verification result.
 * @example
 * const result = await verifyGdCredentialsViaApi(result);
 */
export const verifyGdCredentialsViaApi = async (result: GdSetupResult): Promise<void> => {
  await Effect.runPromise(
    verifyGodaddyCredentials({
      GODADDY_API_KEY: result.apiKey,
      GODADDY_API_SECRET: result.apiSecret,
      GODADDY_OTE: result.ote,
    }),
  );
};
