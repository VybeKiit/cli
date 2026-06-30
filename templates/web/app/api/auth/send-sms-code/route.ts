import { captureAuthFailure, captureAuthRejection } from '@/lib/auth-telemetry';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/** POST body: `{ phone: string }` */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Enter your phone number.' }, { status: 400 });
    }

    const result = await resolveAuthProvider().sendSmsCode(phone);
    if (!result.ok) {
      captureAuthRejection(result.error.message, {
        code: result.error.code,
        route: 'send-sms-code',
      });
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureAuthFailure(error, { route: 'send-sms-code' });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
