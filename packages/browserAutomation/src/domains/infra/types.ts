import { CLOUDFLARE_DASHBOARD_URL } from '@vybekiit/browser-automation/core/constants';
import type { BaseVerbContext } from '@vybekiit/browser-automation/core/types';

export type CfVerbContext = BaseVerbContext;

/** Cloudflare dashboard origin — entry point for browser-fallback token minting. */
export const CF_DASHBOARD_URL = CLOUDFLARE_DASHBOARD_URL;

/** Result of Cloudflare API token creation. */
export type CfSetupResult = {
  token: string;
  tokenId: string;
  accountId: string;
  name: string;
};

/** Env block written to .env. Token is NOT included in agent-visible output. */
export type CfEnvBlock = {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
} & Record<string, string>;

/**
 * Cf Env Block.
 *
 * @param result - Operation result to convert.
 * @returns Computed value for downstream automation.
 * @example
 * const result = cfEnvBlock(result);
 */
export const cfEnvBlock = (result: CfSetupResult): CfEnvBlock => ({
  CLOUDFLARE_ACCOUNT_ID: result.accountId,
  CLOUDFLARE_API_TOKEN: result.token,
});
