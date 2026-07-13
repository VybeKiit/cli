import type { HopClass } from './types';

const QUOTA_MARKERS = [
  'quota',
  'free tier',
  'free-tier',
  'rate limit',
  'plan limit',
  'exceeded your',
  'usage limit',
] as const;

/** Lemon Squeezy store/papers not ready and similar free-path blockers. */
const ONBOARDING_MARKERS = [
  'onboarding',
  'complete your profile',
  'verify your email',
  'finish setup',
  'not ready',
  'account incomplete',
  'store not',
  'papers not',
  'kyc',
  'identity verification',
  'business verification',
] as const;

const MISSING_CREDENTIALS_MARKERS = [
  'missing_credentials',
  'not configured',
  'no credentials',
  'unconfigured',
  'credentials missing',
  'api key missing',
  'secret missing',
  'webhook secret missing',
] as const;

/**
 * True when haystack contains any marker.
 *
 * @param haystack - Lowercased blob.
 * @param markers - Phrases.
 * @returns Whether any marker is present.
 */
const includesAny = (haystack: string, markers: readonly string[]): boolean =>
  markers.some((marker) => haystack.includes(marker));

/**
 * Classify a payments-provider failure for ladder hop (ADR-0039).
 * Lemon Squeezy onboarding-blocked free path is hop-class (same as free-tier).
 *
 * @param code - Stable error code.
 * @param message - Dev message (never shown raw to the builder).
 * @returns Hop classification.
 * @example
 * classifyPaymentsHopSignal('onboarding_blocked', 'Store not ready') === 'onboarding_blocked';
 */
export const classifyPaymentsHopSignal = (code: string, message: string): HopClass => {
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
 * Whether the payments orchestrator should try the next ladder entry.
 *
 * @param hopClass - Classified failure.
 * @returns True for hop/skip classes.
 * @example
 * shouldContinuePaymentsLadder('onboarding_blocked') === true;
 */
export const shouldContinuePaymentsLadder = (hopClass: HopClass): boolean =>
  hopClass === 'quota' || hopClass === 'onboarding_blocked' || hopClass === 'missing_credentials';
