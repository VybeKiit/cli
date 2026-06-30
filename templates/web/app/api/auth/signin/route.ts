import { setSessionCookie } from '@/lib/auth-session';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from '@/lib/auth-telemetry';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/** Email + password sign-in. */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, password } = await request.json();
    if (!(email && password)) {
      return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
    }

    const result = await resolveAuthProvider().signInWithPassword(email, password);
    if (!result.ok) {
      captureAuthRejection(result.error.message, { code: result.error.code, route: 'signin' });
      return NextResponse.json({ error: result.error.message }, { status: 401 });
    }

    await setSessionCookie(result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'password' });
    return NextResponse.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'signin' });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
