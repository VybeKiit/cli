import { createAuthClient } from '@vybekiit/auth/client';
import { postJson } from '@/lib/fetch-json';

/**
 * Buyer-facing auth wire points — the ONE file the `add-signin` skill touches.
 *
 * Each call POSTs to a server route under `/api/auth/*` that runs the real
 * `resolveAuthProvider()` from `@vybekiit/auth`. The provider code stays on the
 * server (those routes), so no secret or backend SDK ever reaches the client bundle.
 */

const client = createAuthClient(postJson);

export const { signInWithPassword, signUpWithPassword, sendEmailCode, verifyEmailCode, signOut } =
  client;
