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

const ONBOARDING_MARKERS = [
  'onboarding',
  'complete your profile',
  'verify your email',
  'finish setup',
  'not ready',
  'account incomplete',
] as const;

const MISSING_CREDENTIALS_MARKERS = [
  'missing_credentials',
  'not configured',
  'no credentials',
  'unconfigured',
  'not logged in',
  'wrangler login',
  'vercel login',
  'railway login',
  'netlify login',
  'gh auth',
  'github_token',
  'netlify_auth_token',
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
 * Classify a host-provider failure for ladder hop (ADR-0039).
 *
 * @param code - Stable error code.
 * @param message - Dev message (never shown raw to the builder).
 * @returns Hop classification.
 * @example
 * classifyHostHopSignal('quota_exceeded', 'Free plan projects full') === 'quota';
 */
export const classifyHostHopSignal = (code: string, message: string): HopClass => {
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
 * Whether the host orchestrator should try the next ladder entry.
 *
 * @param hopClass - Classified failure.
 * @returns True for hop/skip classes.
 * @example
 * shouldContinueHostLadder('quota') === true;
 */
export const shouldContinueHostLadder = (hopClass: HopClass): boolean =>
  hopClass === 'quota' || hopClass === 'onboarding_blocked' || hopClass === 'missing_credentials';
