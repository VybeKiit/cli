import { verifyNamecheapCredentials } from '@vybekiit/deploy';

import { ncSetupEnvBlock, type NcSetupResult } from '../types';

/** Validates scraped Namecheap credentials against the live API. */
export async function verifyNcCredentialsViaApi(result: NcSetupResult): Promise<void> {
  await verifyNamecheapCredentials({
    NAMECHEAP_API_USER: result.apiUser,
    NAMECHEAP_API_KEY: result.apiKey,
    NAMECHEAP_CLIENT_IP: result.clientIp,
    NAMECHEAP_SANDBOX: result.sandbox,
  });
}

export { ncSetupEnvBlock };
