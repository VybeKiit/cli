import { setSessionCookie } from '@/lib/auth-session';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from '@/lib/auth-telemetry';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/** POST body: `{ token: string, newPassword: string }` */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { token, newPassword } = await request.json();
    if (!(token && newPassword)) {
      return NextResponse.json({ error: 'Enter your new password.' }, { status: 400 });
    }

    const result = await resolveAuthProvider().resetPassword(token, newPassword);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'reset-password',
      });
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    await setSessionCookie(result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'password' });
    return NextResponse.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'reset-password' });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
