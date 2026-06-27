/**
 * Centralized external endpoints and stable identifiers.
 *
 * Why one file: per project standards, base URLs and path prefixes must not be
 * scattered as raw strings across feature code. Every package imports these
 * instead of hard-coding hosts, so a vendor URL change is a one-line edit here.
 */

/** Lemon Squeezy REST API base (used by `@vybekiit/pay-lemonsqueezy`). */
export const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1' as const;

/** GitHub REST API base (used by the gate webhook to invite/remove buyers). */
export const GITHUB_API_BASE = 'https://api.github.com' as const;

/** Default local dev origin — kept in sync with `.env.example`'s `APP_URL`. */
export const DEFAULT_APP_URL = 'http://localhost:3000' as const;
