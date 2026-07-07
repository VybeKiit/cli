import type { BaseVerbContext } from '@vybekiit/browser-automation/core/types';

export type NcVerbContext = BaseVerbContext;

export const NC_API_ACCESS_URL = 'https://ap.www.namecheap.com/settings/tools/apiaccess/';

export type NcSetupResult = {
  apiKey: string;
  apiUser: string;
  clientIp: string;
  reusedExisting?: boolean;
  sandbox: boolean;
};

export type NcSetupParams = {
  sandbox?: boolean;
};

export type NcEnvBlock = {
  NAMECHEAP_API_USER: string;
  NAMECHEAP_API_KEY: string;
  NAMECHEAP_CLIENT_IP: string;
  NAMECHEAP_SANDBOX?: string;
};

/**
 * Nc Setup Env Block.
 *
 * @param result - Operation result to convert.
 * @returns Computed value for downstream automation.
 * @example
 * const result = ncSetupEnvBlock(result);
 */
export const ncSetupEnvBlock = (result: NcSetupResult): NcEnvBlock => {
  const env: NcEnvBlock = {
    NAMECHEAP_API_USER: result.apiUser,
    NAMECHEAP_API_KEY: result.apiKey,
    NAMECHEAP_CLIENT_IP: result.clientIp,
  };
  if (result.sandbox) {
    env.NAMECHEAP_SANDBOX = '1';
  }
  return env;
};
