import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/**
 * Send a one-time sign-in code to an email address (passwordless flow).
 *
 * Delegates to the resolved {@link AuthProvider}. With no `.env` the local dev
 * adapter (ADR-0008) succeeds without mailing anything (any code verifies later), so
 * the verify screen works offline; the `add-signin` skill wires real email OTP by env.
 *
 * POST body: `{ email: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: 'Enter your email.' }, { status: 400 });

  const result = await resolveAuthProvider().sendEmailCode(email);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}
