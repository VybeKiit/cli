import { createAuthClient } from '@vybekiit/auth/client';
import { postJson } from '@/lib/fetchJson';

/**
 * Buyer-facing auth wire points — the ONE file the `connect-account` skill edits.
 *
 * POSTs to `/api/auth/*` on the builder's web backend (via `APP_URL`). Mirrors
 * the web template's `auth-client.ts` so both platforms behave identically.
 */

const client = createAuthClient(postJson);

export const { signInWithPassword, signUpWithPassword, sendEmailCode, verifyEmailCode, signOut } =
  client;
