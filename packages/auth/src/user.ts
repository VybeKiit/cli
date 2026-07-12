import { Schema } from 'effect';

/**
 * Schema SSOT for the normalized authenticated user (ADR-0043). The typed client
 * and the OpenAPI document both derive from this, so the shape the frontend
 * assumes cannot drift from the shape the server emits.
 */
export const AuthUserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.NullOr(Schema.String),
});

/**
 * VybeKiit's normalized authenticated user.
 *
 * Decoupled from Supabase's `User` shape so the rest of the app (and the buyer's
 * agent) depends on a small, stable contract — if the auth provider ever changes,
 * only this mapping moves.
 */
export type AuthUser = typeof AuthUserSchema.Type;

/** The subset of a provider user object we map from. */
type RawUser = {
  readonly id?: string | null | undefined;
  readonly email?: string | null | undefined;
};

/**
 * Map a provider user object to {@link AuthUser}, or `null` if there's no valid
 * user (missing id). Kept pure so the mapping is unit-testable without network.
 *
 * @param raw - Provider user payload to normalize.
 * @returns The normalized auth user, or null when the id is missing.
 * @example
 * const user = normalizeAuthUser({ id: 'user_1', email: 'a@example.com' });
 */
export const normalizeAuthUser = (raw: RawUser | null | undefined): AuthUser | null => {
  if (raw === null || raw === undefined || raw.id === null || raw.id === undefined) {
    return null;
  }
  return { id: raw.id, email: raw.email === undefined ? null : raw.email };
};
