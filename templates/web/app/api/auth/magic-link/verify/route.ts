import { setSessionCookie } from '@/lib/auth-session';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from '@/lib/auth-telemetry';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/** POST body: `{ token: string }` */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'That sign-in link is not valid.' }, { status: 400 });
    }

    const result = await resolveAuthProvider().verifyMagicLink(token);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'magic-link-verify',
      });
      return NextResponse.json({ error: result.error.message }, { status: 401 });
    }

    await setSessionCookie(result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'magic_link' });
    return NextResponse.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'magic-link-verify' });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
