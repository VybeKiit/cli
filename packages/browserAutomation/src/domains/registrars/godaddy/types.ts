import type { BaseVerbContext } from '@vybekiit/browserAutomation/core/types';

export type GdVerbContext = BaseVerbContext;

export const GD_KEYS_URL = 'https://developer.godaddy.com/keys';

export type GdSetupResult = {
  apiKey: string;
  apiSecret: string;
  ote: boolean;
  reusedExisting?: boolean;
};

export type GdSetupParams = {
  keyName?: string;
  ote?: boolean;
};

export type GdEnvBlock = {
  GODADDY_API_KEY: string;
  GODADDY_API_SECRET: string;
  GODADDY_OTE?: string;
};

export function gdSetupEnvBlock(result: GdSetupResult): GdEnvBlock {
  const env: GdEnvBlock = {
    GODADDY_API_KEY: result.apiKey,
    GODADDY_API_SECRET: result.apiSecret,
  };
  if (result.ote) {
    env.GODADDY_OTE = '1';
  }
  return env;
}
