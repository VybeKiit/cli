import type { BaseVerbContext } from '../../../core/types';

export type LsSetupMode = 'test' | 'live';

export type LsSetupParams = {
  filesPath?: string;
  imagePath?: string;
  mode: LsSetupMode;
  name: string;
  priceCents: number;
  webhookUrl: string;
};

export type LsSetupResult = {
  apiKey: string;
  storeId: string;
  variantId: string;
  webhookSecret: string;
};

export type LsVerbContext = BaseVerbContext;

export const LS_DASHBOARD_URL = 'https://app.lemonsqueezy.com/dashboard';
