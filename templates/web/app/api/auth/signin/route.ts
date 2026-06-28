import { setSessionCookie } from '@/lib/auth-session';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/**
 * Email + password sign-in.
 *
 * Calls the resolved {@link AuthProvider} and, on success, mints the session marker
 * cookie `/api/auth/me` reads back. With no `.env` the local dev adapter (ADR-0008)
 * accepts any credentials and returns the dev user, so the screen works offline; the
 * `add-signin` skill swaps in a real backend (and its real session token) by env.
 *
 * POST body: `{ email: string, password: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const result = await resolveAuthProvider().signInWithPassword(email, password);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 401 });

  await setSessionCookie(result.value.id);
  return NextResponse.json(result.value);
}
