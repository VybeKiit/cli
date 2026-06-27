import type { SupabaseClient } from '@supabase/supabase-js';
import { type Result, fail, ok } from '@vybekiit/core';
import { type AuthUser, normalizeAuthUser } from './user';

/**
 * Create a new account with email + password.
 *
 * Returns a {@link Result}: auth failures (weak password, email taken) are
 * expected and must be translated to plain language by a skill, not thrown.
 */
export async function signUp(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) return fail('signup_failed', error.message);

  const user = normalizeAuthUser(data.user);
  return user ? ok(user) : fail('no_user', 'Sign up succeeded but returned no user.');
}

/** Sign in with email + password, normalized to a {@link Result}. */
export async function signIn(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<Result<AuthUser>> {
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return fail('signin_failed', error.message);

  const user = normalizeAuthUser(data.user);
  return user ? ok(user) : fail('no_user', 'Sign in returned no user.');
}

/** Resolve the current user from an access token (e.g. in a server route). */
export async function getUser(
  client: SupabaseClient,
  accessToken: string,
): Promise<Result<AuthUser>> {
  const { data, error } = await client.auth.getUser(accessToken);
  if (error) return fail('get_user_failed', error.message);

  const user = normalizeAuthUser(data.user);
  return user ? ok(user) : fail('no_user', 'No user for the given token.');
}
