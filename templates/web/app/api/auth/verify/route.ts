import { setSessionCookie } from '@/lib/auth-session';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from '@/lib/auth-telemetry';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/** POST body: `{ email: string, code: string }` */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email, code } = await request.json();
    if (!(email && code)) {
      return NextResponse.json({ error: 'Enter the code we sent you.' }, { status: 400 });
    }

    const result = await resolveAuthProvider().verifyEmailCode(email, code);
    if (!result.ok) {
      captureAuthRejection(result.error.message, { code: result.error.code, route: 'verify' });
      return NextResponse.json({ error: result.error.message }, { status: 401 });
    }

    await setSessionCookie(result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'email_code' });
    return NextResponse.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'verify' });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
