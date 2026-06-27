/**
 * Checkout input validation, shared by the checkout form (client) and the checkout
 * route (server) so both judge the same input by one rule — the server is the
 * authority, the client is for instant inline feedback.
 */

/**
 * GitHub's real username rule: 1–39 characters, alphanumeric or single hyphens,
 * no leading or trailing hyphen, and no consecutive hyphens. Anchored so the whole
 * string must match.
 */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/**
 * A pragmatic email check: a non-empty local part, an `@`, and a dotted domain.
 * Deliberately not RFC-exhaustive — the payment provider and a real verification
 * email are the true authority; this only catches obvious typos before submit.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** True when `username` is a syntactically valid GitHub username. */
export function isValidGithubUsername(username: string): boolean {
  return GITHUB_USERNAME.test(username);
}

/** True when `email` looks like a usable email address. */
export function isValidEmail(email: string): boolean {
  return EMAIL.test(email);
}
