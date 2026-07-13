import type { HopClass } from './types';

/** Allowlisted substrings for free-tier / plan exhaustion (case-insensitive). */
const QUOTA_MARKERS = [
  'quota',
  'free tier',
  'free-tier',
  'rate limit',
  'rate_limit',
  'resource limit',
  'plan limit',
  'exceeded your',
  'usage limit',
  'project limit',
  'database limit',
  'over_limit',
  'over limit',
] as const;

/** Allowlisted substrings for onboarding-blocked free paths. */
const ONBOARDING_MARKERS = [
  'onboarding',
  'complete your profile',
  'verify your email',
  'finish setup',
  'not ready',
  'account incomplete',
  'store not',
  'papers not',
] as const;

/** Missing credentials / not configured — skip this ladder entry, do not hard-stop. */
const MISSING_CREDENTIALS_MARKERS = [
  'missing_credentials',
  'not configured',
  'no credentials',
  'unconfigured',
  'credentials missing',
  'api key missing',
  'token missing',
  'not logged in',
  'unauthorized: missing',
] as const;

/**
 * True when `haystack` contains any allowlisted marker.
 *
 * @param haystack - Lowercased message + code.
 * @param markers - Allowlist phrases.
 * @returns Whether any marker is present.
 */
const includesAny = (haystack: string, markers: readonly string[]): boolean =>
  markers.some((marker) => haystack.includes(marker));

/**
 * Classify a data-provider failure for ladder hop (ADR-0039).
 * Only allowlisted plan/quota/onboarding signals hop; unknown 403/500 → hard_stop.
 *
 * @param code - Stable error code from the adapter or step.
 * @param message - Human/dev message (never shown raw to the builder).
 * @returns Hop classification for the orchestrator.
 * @example
 * classifyDataHopSignal('quota_exceeded', 'Free tier project limit') === 'quota';
 * classifyDataHopSignal('db_unreachable', 'ECONNREFUSED') === 'hard_stop';
 */
export const classifyDataHopSignal = (code: string, message: string): HopClass => {
  const haystack = `${code} ${message}`.toLowerCase();

  if (code === 'missing_credentials' || includesAny(haystack, MISSING_CREDENTIALS_MARKERS)) {
    return 'missing_credentials';
  }
  if (code === 'quota' || code === 'quota_exceeded' || includesAny(haystack, QUOTA_MARKERS)) {
    return 'quota';
  }
  if (code === 'onboarding_blocked' || includesAny(haystack, ONBOARDING_MARKERS)) {
    return 'onboarding_blocked';
  }

  return 'hard_stop';
};

/**
 * Whether the orchestrator should try the next ladder entry after this class.
 *
 * @param hopClass - Classified failure.
 * @returns True for hop/skip classes; false for hard stop or named-stick stop.
 * @example
 * shouldContinueLadder('quota') === true;
 * shouldContinueLadder('hard_stop') === false;
 */
export const shouldContinueLadder = (hopClass: HopClass): boolean =>
  hopClass === 'quota' || hopClass === 'onboarding_blocked' || hopClass === 'missing_credentials';
