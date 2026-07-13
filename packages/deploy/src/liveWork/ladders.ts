import type { EnvSource } from '@vybekiit/core';
import type { HostLadderProvider } from './types';

/**
 * Preference ladder for the host concern (ADR-0039).
 * Includes `render` before it is a full HOSTING_PROVIDER schema value (create path next).
 */
export const HOST_PREFERENCE_LADDER = [
  'cloudflare',
  'render',
  'railway',
  'vercel',
  'netlify',
  'github-pages',
] as const satisfies readonly HostLadderProvider[];

/**
 * True when value is a host ladder provider id.
 *
 * @param value - Candidate.
 * @returns Whether on the host preference ladder.
 * @example
 * isHostLadderProvider('cloudflare') === true;
 */
export const isHostLadderProvider = (value: string): value is HostLadderProvider =>
  (HOST_PREFERENCE_LADDER as readonly string[]).includes(value);

/**
 * Resolve which host ladder entries to try.
 *
 * @param env - Raw environment (pin from HOSTING_PROVIDER).
 * @param namedVendor - Optional vendor the builder named.
 * @returns Ordered adapters.
 * @example
 * resolveHostLadderOrder({}, 'vercel'); // → ['vercel']
 */
export const resolveHostLadderOrder = (
  env: EnvSource,
  namedVendor?: HostLadderProvider | null,
): readonly HostLadderProvider[] => {
  if (namedVendor !== undefined && namedVendor !== null) {
    return [namedVendor];
  }

  // Read raw pin — do not parseEnv(hostingConfigSchema): render is ladder-first (ADR-0039)
  // before it is a full schema enum member; aws is off this ladder.
  const raw = env.HOSTING_PROVIDER;
  if (typeof raw === 'string' && isHostLadderProvider(raw)) {
    const start = HOST_PREFERENCE_LADDER.indexOf(raw);
    if (start >= 0) {
      return HOST_PREFERENCE_LADDER.slice(start);
    }
  }

  return HOST_PREFERENCE_LADDER;
};

/**
 * Read the active host pin when it sits on the preference ladder.
 *
 * @param env - Raw environment.
 * @returns Pinned host provider or null.
 * @example
 * readHostPin({ HOSTING_PROVIDER: 'vercel' }) === 'vercel';
 */
export const readHostPin = (env: EnvSource): HostLadderProvider | null => {
  const raw = env.HOSTING_PROVIDER;
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  return isHostLadderProvider(raw) ? raw : null;
};
