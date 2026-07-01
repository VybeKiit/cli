import type { BaseVerbContext } from '../../../core/types';

export type LsSetupMode = 'test' | 'live';

export type LsSetupParams = {
  description?: string;
  filesPath?: string;
  hideFromStorefront?: boolean;
  imagePath?: string;
  licenseKeys?: boolean;
  mode: LsSetupMode;
  name: string;
  priceCents: number;
  reuseProductId?: string;
  webhookUrl: string;
};

export type LsSetupResult = {
  apiKey: string;
  productId: string;
  storeId: string;
  variantId: string;
  webhookSecret: string;
};

export type LsVerbContext = BaseVerbContext;

export const LS_DASHBOARD_URL = 'https://app.lemonsqueezy.com/dashboard';
