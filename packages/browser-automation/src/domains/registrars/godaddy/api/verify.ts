import { verifyGodaddyCredentials } from '@vybekiit/deploy';

import { gdSetupEnvBlock, type GdSetupResult } from '../types';

/** Validates scraped GoDaddy credentials against the live API. */
export async function verifyGdCredentialsViaApi(result: GdSetupResult): Promise<void> {
  await verifyGodaddyCredentials({
    GODADDY_API_KEY: result.apiKey,
    GODADDY_API_SECRET: result.apiSecret,
    GODADDY_OTE: result.ote,
  });
}

export { gdSetupEnvBlock };
