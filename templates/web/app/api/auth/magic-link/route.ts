import { captureAuthFailure, captureAuthRejection } from '@/lib/auth-telemetry';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/** POST body: `{ email: string }` */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Enter your email address.' }, { status: 400 });
    }

    const result = await resolveAuthProvider().sendMagicLink(email);
    if (!result.ok) {
      captureAuthRejection(result.error.message, { code: result.error.code, route: 'magic-link' });
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    captureAuthFailure(error, { route: 'magic-link' });
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}
