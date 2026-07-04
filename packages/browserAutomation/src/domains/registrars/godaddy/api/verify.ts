import {
  type GdSetupResult,
  gdSetupEnvBlock,
} from '@vybekiit/browserAutomation/domains/registrars/godaddy/types';
import { verifyGodaddyCredentials } from '@vybekiit/deploy';

/** Validates scraped GoDaddy credentials against the live API. */
export async function verifyGdCredentialsViaApi(result: GdSetupResult): Promise<void> {
  await verifyGodaddyCredentials({
    GODADDY_API_KEY: result.apiKey,
    GODADDY_API_SECRET: result.apiSecret,
    GODADDY_OTE: result.ote,
  });
}

export { gdSetupEnvBlock };
