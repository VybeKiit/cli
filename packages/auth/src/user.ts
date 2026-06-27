/**
 * VybeKiit's normalized authenticated user.
 *
 * Decoupled from Supabase's `User` shape so the rest of the app (and the buyer's
 * agent) depends on a small, stable contract — if the auth provider ever changes,
 * only this mapping moves.
 */
export interface AuthUser {
  readonly id: string;
  readonly email: string | null;
}

/** The subset of a provider user object we map from. */
interface RawUser {
  readonly id?: string | null;
  readonly email?: string | null;
}

/**
 * Map a provider user object to {@link AuthUser}, or `null` if there's no valid
 * user (missing id). Kept pure so the mapping is unit-testable without network.
 */
export function normalizeAuthUser(raw: RawUser | null | undefined): AuthUser | null {
  if (!raw?.id) return null;
  return { id: raw.id, email: raw.email ?? null };
}
