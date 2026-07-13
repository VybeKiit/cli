import { dataConfigSchema, type EnvSource, parseEnv } from '@vybekiit/core';
import type { DataLadderProvider } from './types';

/**
 * Preference ladder for the data concern (ADR-0039).
 * Try-order **before** pin only — never multi-active providers (ADR-0018).
 */
export const DATA_PREFERENCE_LADDER = [
  'supabase',
  'neon',
  'railway',
] as const satisfies readonly DataLadderProvider[];

/**
 * True when `value` is a data ladder provider id.
 *
 * @param value - Candidate string.
 * @returns Whether the value is on the data preference ladder.
 * @example
 * isDataLadderProvider('neon') === true;
 */
export const isDataLadderProvider = (value: string): value is DataLadderProvider =>
  (DATA_PREFERENCE_LADDER as readonly string[]).includes(value);

/**
 * Resolve which ladder entries to try for this Live work run.
 *
 * - **Named vendor stick**: only that adapter (never hop away).
 * - **Pinned `DATA_PROVIDER` on the ladder**: start at pin, then later entries as fallbacks.
 * - Otherwise full ladder from #1.
 *
 * @param env - Raw environment (pin read from `DATA_PROVIDER`).
 * @param namedVendor - Optional vendor the builder named in the prompt.
 * @returns Ordered adapters to attempt (never empty when named or full ladder).
 * @example
 * resolveDataLadderOrder({}, 'neon'); // → ['neon']
 * resolveDataLadderOrder({ DATA_PROVIDER: 'neon' }); // → ['neon', 'railway']
 */
export const resolveDataLadderOrder = (
  env: EnvSource,
  namedVendor?: DataLadderProvider | null,
): readonly DataLadderProvider[] => {
  if (namedVendor !== undefined && namedVendor !== null) {
    return [namedVendor];
  }

  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, env);
  if (isDataLadderProvider(DATA_PROVIDER)) {
    const start = DATA_PREFERENCE_LADDER.indexOf(DATA_PROVIDER);
    if (start >= 0) {
      return DATA_PREFERENCE_LADDER.slice(start);
    }
  }

  return DATA_PREFERENCE_LADDER;
};

/**
 * Read the active data pin when it sits on the preference ladder.
 *
 * @param env - Raw environment source.
 * @returns Pinned ladder provider, or `null` when unset / off-ladder (e.g. `mongodb`).
 * @example
 * readDataPin({ DATA_PROVIDER: 'neon' }) === 'neon';
 */
export const readDataPin = (env: EnvSource): DataLadderProvider | null => {
  const raw = env.DATA_PROVIDER;
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  return isDataLadderProvider(raw) ? raw : null;
};
