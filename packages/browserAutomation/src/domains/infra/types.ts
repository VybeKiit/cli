import { CLOUDFLARE_DASHBOARD_URL } from '@vybekiit/browserAutomation/core/constants';
import type { BaseVerbContext } from '@vybekiit/browserAutomation/core/types';

export type CfVerbContext = BaseVerbContext;

/** Cloudflare dashboard origin — entry point for browser-fallback token minting. */
export const CF_DASHBOARD_URL = CLOUDFLARE_DASHBOARD_URL;

/** Result of Cloudflare API token creation. */
export interface CfSetupResult {
  token: string;
  tokenId: string;
  accountId: string;
  name: string;
}

/** Env block written to .env. Token is NOT included in agent-visible output. */
export type CfEnvBlock = {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
} & Record<string, string>;

export function cfEnvBlock(result: CfSetupResult): CfEnvBlock {
  return {
    CLOUDFLARE_ACCOUNT_ID: result.accountId,
    CLOUDFLARE_API_TOKEN: result.token,
  };
}
