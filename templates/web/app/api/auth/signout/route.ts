import { clearSessionCookie } from '@/lib/auth-session';
import { NextResponse } from 'next/server';

/** Clear the session marker cookie (sign-out). */
export async function POST(): Promise<NextResponse> {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
