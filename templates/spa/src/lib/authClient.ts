import { createAuthClient } from '@vybekiit/auth/client';
import { postJson } from '@/lib/fetchJson';

/**
 * Buyer-facing auth wire points — the ONE file the `add-signin` skill touches.
 *
 * POSTs to `/api/auth/*` on the Express backend (via `VITE_PUBLIC_APP_URL`).
 */

const client = createAuthClient(postJson);

export const {
  signInWithPassword,
  signUpWithPassword,
  sendEmailCode,
  verifyEmailCode,
  signOut,
} = client;
