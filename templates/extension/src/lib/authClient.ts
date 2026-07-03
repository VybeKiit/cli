import { createAuthClient } from '@vybekiit/auth/client';
import { postJson } from './fetchJson';

/** Buyer-facing auth wire points — the ONE file the `connect-account` skill edits. */
const client = createAuthClient(postJson);

export const { signInWithPassword, signUpWithPassword, sendEmailCode, verifyEmailCode, signOut } =
  client;
