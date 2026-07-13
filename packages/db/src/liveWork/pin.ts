import type { DataLadderProvider, ProvisionedData } from './types';

/**
 * Auth adapter that follows a data ladder winner (ADR-0039 / ADR-0024).
 * No auth preference ladder — Supabase data → Supabase Auth; other Postgres → better-auth.
 *
 * @param dataProvider - Winning data ladder provider.
 * @returns Explicit `AUTH_PROVIDER` value to pin when unset.
 * @example
 * companionAuthForData('neon') === 'better-auth';
 * companionAuthForData('supabase') === 'supabase';
 */
export const companionAuthForData = (
  dataProvider: DataLadderProvider,
): 'supabase' | 'better-auth' => (dataProvider === 'supabase' ? 'supabase' : 'better-auth');

/**
 * Options for {@link buildDataPinKeys}.
 */
export type BuildDataPinKeysOptions = {
  /**
   * Existing `AUTH_PROVIDER` from env. When set, the companion is not written
   * (explicit auth choice sticks — ADR-0039 auth follows data only when unset).
   */
  readonly existingAuthProvider?: string;
};

/**
 * Build root `.env` keys for a successful data pin (ADR-0039).
 * Secrets are returned for the secure write path — never print them in UI/logs.
 * Pins companion `AUTH_PROVIDER` when the builder has not set one (A14).
 *
 * @param provisioned - Winner from the ladder / existing connection.
 * @param options - Optional existing auth pin (skip companion when present).
 * @returns Key map for `DATA_PROVIDER` (+ auth companion + connection secrets when present).
 * @example
 * buildDataPinKeys({ provider: 'neon', databaseUrl: 'postgresql://…', ephemeral: true });
 */
export const buildDataPinKeys = (
  provisioned: ProvisionedData,
  options: BuildDataPinKeysOptions = {},
): Record<string, string> => {
  const pin: Record<string, string> = {
    DATA_PROVIDER: provisioned.provider,
  };

  const existingAuth = options.existingAuthProvider;
  if (existingAuth === undefined || existingAuth.length === 0) {
    pin.AUTH_PROVIDER = companionAuthForData(provisioned.provider);
  }

  if (typeof provisioned.databaseUrl === 'string' && provisioned.databaseUrl.length > 0) {
    pin.DATABASE_URL = provisioned.databaseUrl;
  }

  if (typeof provisioned.claimUrl === 'string' && provisioned.claimUrl.length > 0) {
    pin.PUBLIC_POSTGRES_CLAIM_URL = provisioned.claimUrl;
  }

  if (typeof provisioned.claimableId === 'string' && provisioned.claimableId.length > 0) {
    pin.CLAIMABLE_POSTGRES_ID = provisioned.claimableId;
  }

  return pin;
};

/**
 * Plain-language success note after verify on the winner (no env/API jargon).
 *
 * @param provider - Winning ladder provider.
 * @param hopped - Whether a free-tier hop occurred.
 * @param fromProvider - Provider left behind when hopped.
 * @returns Buyer-facing message.
 * @example
 * buyerDataSuccessMessage('neon', true, 'supabase');
 */
export const buyerDataSuccessMessage = (
  provider: DataLadderProvider,
  hopped: boolean,
  fromProvider?: DataLadderProvider,
): string => {
  const brand = dataBrand(provider);
  if (hopped && fromProvider) {
    return `${dataBrand(fromProvider)} free plan was full, so we switched your place that remembers things to ${brand}. It works. You're set.`;
  }
  return `Your place that remembers things is ready on ${brand}.`;
};

const BRANDS: Record<DataLadderProvider, string> = {
  supabase: 'Supabase',
  neon: 'Neon',
  railway: 'Railway',
};

/**
 * Display brand for a ladder provider (buyer-facing).
 *
 * @param provider - Ladder provider id.
 * @returns Capitalized vendor name.
 * @example
 * dataBrand('neon') === 'Neon';
 */
export const dataBrand = (provider: DataLadderProvider): string => BRANDS[provider];
