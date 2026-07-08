import type { BaseVerbContext } from '@vybekiit/browser-automation/core/types';

/** Lemon Squeezy environment mode used while provisioning payments. */
export type LsSetupMode = 'test' | 'live';

/** Input collected by the Lemon Squeezy setup wizard or CLI flags. */
export type LsSetupParams = {
  readonly description?: string;
  readonly filesPath?: string;
  readonly hideFromStorefront?: boolean;
  readonly imagePath?: string;
  readonly licenseKeys?: boolean;
  readonly mode: LsSetupMode;
  readonly name: string;
  readonly priceCents: number;
  readonly reuseProductId?: string;
  readonly webhookUrl: string;
};

/** Provisioned Lemon Squeezy identifiers required by the buyer template. */
export type LsSetupResult = {
  readonly apiKey: string;
  readonly productId: string;
  readonly storeId: string;
  readonly variantId: string;
  readonly webhookSecret: string;
};

/** Runtime context passed to Lemon Squeezy browser automation verbs. */
export type LsVerbContext = BaseVerbContext;

/** Lemon Squeezy dashboard root URL used by the browser connector. */
export const LS_DASHBOARD_URL = 'https://app.lemonsqueezy.com/dashboard';
