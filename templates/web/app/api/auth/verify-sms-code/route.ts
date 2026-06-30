import { setSessionCookie } from '@/lib/auth-session';
import { captureAuthFailure, captureAuthRejection, trackAuthEvent } from '@/lib/auth-telemetry';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/** POST body: `{ phone: string, code: string }` */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { phone, code } = await request.json();
    if (!(phone && code)) {
      return NextResponse.json({ error: 'Enter the code we sent you.' }, { status: 400 });
    }

    const result = await resolveAuthProvider().verifySmsCode(phone, code);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'verify-sms-code',
      });
      return NextResponse.json({ error: result.error.message }, { status: 401 });
    }

    await setSessionCookie(result.value.id);
    trackAuthEvent('sign_in_completed', { method: 'sms' });
    return NextResponse.json(result.value);
  } catch (error) {
    captureAuthFailure(error, { route: 'verify-sms-code' });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
