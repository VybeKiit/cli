/**
 * Checkout input validation, shared by the checkout form (client) and the checkout
 * route (server) so both judge the same input by one rule — the server is the
 * authority, the client is for instant inline feedback.
 */
import { Schema } from 'effect';

/**
 * GitHub's real username rule: 1–39 characters, alphanumeric or single hyphens,
 * no leading or trailing hyphen, and no consecutive hyphens. Anchored so the whole
 * string must match. e.g. `octocat` and `a-b-c` match; `-x`, `x-`, `a--b` do not.
 */
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/**
 * A pragmatic email check: a non-empty local part, an `@`, and a dotted domain.
 * Deliberately not RFC-exhaustive — the payment provider and a real verification
 * email are the true authority; this only catches obvious typos before submit.
 * e.g. `a@b.co` matches, `a@b` does not.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * True when `username` is a syntactically valid GitHub username.
 *
 * @param username - Input value.
 * @returns Whether the username matches GitHub's public rules.
 * @example
 * isValidGithubUsername('octocat'); // true
 */
export const isValidGithubUsername = (username: string): boolean => GITHUB_USERNAME.test(username);

/**
 * True when `email` looks like a usable email address.
 *
 * @param email - Input value.
 * @returns Whether the email has a local part, `@`, and dotted domain.
 * @example
 * isValidEmail('you@example.com'); // true
 */
export const isValidEmail = (email: string): boolean => EMAIL.test(email);

/** Effect Schema field for a GitHub username accepted by checkout. */
export const GithubUsernameSchema = Schema.String.pipe(
  Schema.filter((username) => isValidGithubUsername(username), {
    message: () => 'Enter a valid GitHub username.',
  }),
);

/** Effect Schema field for a checkout email address. */
export const CheckoutEmailSchema = Schema.String.pipe(
  Schema.filter((email) => isValidEmail(email), {
    message: () => 'Enter a valid email address.',
  }),
);

/** POST body for the landing store checkout route. */
export const LandingCheckoutBodySchema = Schema.Struct({
  githubUsername: GithubUsernameSchema,
  email: CheckoutEmailSchema,
});

/** Static type inferred from {@link LandingCheckoutBodySchema}. */
export type LandingCheckoutBody = typeof LandingCheckoutBodySchema.Type;
