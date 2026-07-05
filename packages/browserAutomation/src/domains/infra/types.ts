import type { BaseVerbContext } from '@vybekiit/browserAutomation/core/types';

export type CfVerbContext = BaseVerbContext;

export const CF_DASHBOARD_URL = 'https://dash.cloudflare.com';

/** Result of Cloudflare API token creation. */
export interface CfSetupResult {
  token: string;
  tokenId: string;
  accountId: string;
  name: string;
}

/** Env block written to .env. Token is NOT included in agent-visible output. */
export interface CfEnvBlock {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
}

export function cfEnvBlock(result: CfSetupResult): CfEnvBlock {
  return {
    CLOUDFLARE_ACCOUNT_ID: result.accountId,
    CLOUDFLARE_API_TOKEN: result.token,
  };
}
