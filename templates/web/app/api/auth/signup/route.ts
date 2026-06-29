import { setSessionCookie } from '@/lib/auth-session';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/**
 * Create an account with email + password.
 *
 * Mirrors the sign-in route: calls the resolved {@link AuthProvider} and mints the
 * session marker cookie on success. With no `.env` the local dev adapter (ADR-0008)
 * returns the dev user so the screen works offline; the `add-signin` skill swaps in a
 * real backend by env.
 *
 * POST body: `{ email: string, password: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { email, password } = await request.json();
  if (!(email && password)) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  const result = await resolveAuthProvider().signUpWithPassword(email, password);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 400 });

  await setSessionCookie(result.value.id);
  return NextResponse.json(result.value);
}
