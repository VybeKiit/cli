import { readSessionCookie } from '@/lib/auth-session';
import { resolveAuthProvider } from '@vybekiit/auth';
import { NextResponse } from 'next/server';

/**
 * Current signed-in user for `useUser()`.
 *
 * Reads the session marker cookie and asks the resolved {@link AuthProvider} who it
 * belongs to. With no `.env` the local dev adapter (ADR-0008) resolves a fixed dev
 * user, so the dashboard lights up offline; once the `add-signin` skill wires a real
 * backend, the same route returns that backend's user. A missing cookie or unknown
 * session returns 401 — `useUser` reads that as signed-out, never an error state.
 */
export async function GET(): Promise<NextResponse> {
  const token = await readSessionCookie();
  if (!token) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const result = await resolveAuthProvider().getUser(token);
  if (!result.ok) return NextResponse.json({ error: result.error.message }, { status: 401 });
  return NextResponse.json(result.value);
}
