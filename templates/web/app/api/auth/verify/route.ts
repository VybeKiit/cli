import { setSessionCookie } from '@/lib/auth-session';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/**
 * Verify a one-time sign-in code and start a session.
 *
 * Calls the resolved {@link AuthProvider} and mints the session marker cookie on
 * success. With no `.env` the local dev adapter (ADR-0008) accepts any code and
 * returns the dev user, so the verify screen completes offline; the `add-signin`
 * skill wires real OTP verification by env.
 *
 * POST body: `{ email: string, code: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { email, code } = await request.json();
  if (!email || !code) {
    return NextResponse.json({ error: 'Enter the code we sent you.' }, { status: 400 });
  }

  const result = await resolveAuthProvider().verifyEmailCode(email, code);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 401 });

  await setSessionCookie(result.value.id);
  return NextResponse.json(result.value);
}
