import type { EnvSource } from '@vybekiit/core';

/**
 * Allowed apex domains for dogfood / Live work custom hosts (ADR-0039).
 * Never deploy throwaway work to the production site root — only subdomains.
 */
export const DOGFOOD_APEX_POOL = ['yosefhayimsabag.dev', 'askally.io', 'ohadbaher.net'] as const;

/**
 * One member of {@link DOGFOOD_APEX_POOL}.
 */
export type DogfoodApex = (typeof DOGFOOD_APEX_POOL)[number];

/**
 * True when value is an allowed dogfood apex (case-insensitive bare domain).
 *
 * @param value - Candidate apex hostname.
 * @returns Whether value is in the pool.
 * @example
 * isAllowedDogfoodApex('askally.io') === true;
 * isAllowedDogfoodApex('evil.com') === false;
 */
export const isAllowedDogfoodApex = (value: string): value is DogfoodApex => {
  const normalized = value.trim().toLowerCase();
  return (DOGFOOD_APEX_POOL as readonly string[]).includes(normalized);
};

/**
 * Parse a user/env string into an allowed dogfood apex.
 * Accepts bare domain or URL; strips `www.` and path/query.
 *
 * @param raw - Env or CLI value.
 * @returns Allowed apex or null.
 * @example
 * parseDogfoodApex('https://www.askally.io/') === 'askally.io';
 * parseDogfoodApex('evil.com') === null;
 */
export const parseDogfoodApex = (raw: string): DogfoodApex | null => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  let host = trimmed;
  try {
    if (trimmed.includes('://')) {
      host = new URL(trimmed).hostname;
    } else if (trimmed.includes('/')) {
      host = trimmed.split('/')[0] ?? trimmed;
    }
  } catch {
    return null;
  }

  // "www.askally.io" → "askally.io" for pool membership
  const withoutWww = host.toLowerCase().replace(/^www\./, '');
  return isAllowedDogfoodApex(withoutWww) ? withoutWww : null;
};

/**
 * Read `DOGFOOD_APEX` from env when it is in the allowed pool.
 *
 * @param env - Raw environment.
 * @returns Allowed apex or null when unset / invalid.
 * @example
 * resolveDogfoodApex({ DOGFOOD_APEX: 'ohadbaher.net' }) === 'ohadbaher.net';
 */
export const resolveDogfoodApex = (env: EnvSource): DogfoodApex | null => {
  const raw = env.DOGFOOD_APEX;
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  return parseDogfoodApex(raw);
};

/**
 * Sanitize a run label for a DNS subdomain segment.
 *
 * @param label - Free-form run id (CI job, demo stamp).
 * @returns Lowercase hyphenated segment (non-empty).
 * @example
 * sanitizeDogfoodLabel('My Run_01!!') === 'my-run-01';
 */
export const sanitizeDogfoodLabel = (label: string): string => {
  const cleaned = label
    .trim()
    .toLowerCase()
    // "My Run_01!!" → "my-run-01"
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 48);
  if (cleaned.length === 0) {
    return `run-${Date.now().toString(36)}`;
  }
  return cleaned;
};

/**
 * Build a dogfood hostname: always a **subdomain** under the apex (`live-<label>.apex`).
 * Never returns the bare apex (production root is forbidden for throwaway deploys).
 *
 * @param apex - Allowed dogfood apex.
 * @param label - Run / project label (sanitized).
 * @returns FQDN under the apex.
 * @example
 * buildDogfoodHostname('askally.io', 'ci-1') === 'live-ci-1.askally.io';
 */
export const buildDogfoodHostname = (apex: DogfoodApex, label: string): string => {
  const segment = sanitizeDogfoodLabel(label);
  return `live-${segment}.${apex}`;
};

/**
 * True when hostname is a **strict subdomain** of the allowed apex (not the apex itself).
 * Rejects bare apex, `www.` apex, and hosts that merely contain the apex as a suffix string
 * without a DNS label boundary.
 *
 * @param hostname - Candidate host (no scheme).
 * @param apex - Allowed dogfood apex.
 * @returns Whether hostname is safe for dogfood attach.
 * @example
 * isDogfoodSubdomainHostname('live-x.askally.io', 'askally.io') === true;
 * isDogfoodSubdomainHostname('askally.io', 'askally.io') === false;
 */
export const isDogfoodSubdomainHostname = (hostname: string, apex: DogfoodApex): boolean => {
  const host = hostname.trim().toLowerCase().replace(/\.$/, '');
  const target = apex.toLowerCase();
  if (host.length === 0 || host === target || host === `www.${target}`) {
    return false;
  }
  // "live-x.askally.io" ends with ".askally.io" and has a real left label
  return host.endsWith(`.${target}`) && host.length > target.length + 1;
};
