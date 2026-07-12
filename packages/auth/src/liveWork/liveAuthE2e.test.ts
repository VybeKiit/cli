import { resolveAuthProvider } from '@vybekiit/auth/resolve';
import { AuthUserSchema } from '@vybekiit/auth/user';
import { Effect, Schema } from 'effect';
import { describe, expect, it } from 'vitest';

/**
 * Real-provider auth e2e (ADR-0042 §4). Secret-gated + nightly (live-work-nightly.yml):
 * skips unless `LIVE_AUTH_E2E=1`, so PR CI and local runs stay deterministic and
 * secret-free. Resolves whichever provider `AUTH_PROVIDER` selects and drives the
 * password round-trip, decoding the returned user against the registry's
 * {@link AuthUserSchema} — proving a real adapter honors the same contract the
 * loopback test proves on the local adapter.
 *
 * Passwordless flows (email-OTP, magic-link, SMS) deliver codes out-of-band and need
 * each provider's admin/test API; they are added per provider as those seams land.
 * Assumes the provider project is configured for automated tests (e.g. email
 * confirmation disabled) so sign-in can follow sign-up without a manual step.
 */
const LIVE = process.env.LIVE_AUTH_E2E === '1';
const decodeUser = Schema.decodeUnknownSync(AuthUserSchema);

describe.runIf(LIVE)('live auth — real provider password round-trip', () => {
  it('signs up, signs in, and reads the user for the configured provider', async () => {
    const email = `vybekiit+${Date.now()}@example.com`;
    const password = 'Test-Password-123!';

    const program = Effect.gen(function* () {
      const auth = yield* resolveAuthProvider();
      const created = yield* auth.signUpWithPassword(email, password);
      const signedIn = yield* auth.signInWithPassword(email, password);
      const user = yield* auth.getUser(signedIn.sessionToken);
      return { created: created.user, signedIn: signedIn.user, user };
    });

    const result = await Effect.runPromise(program);

    // The real provider's user decodes cleanly against the registry response Schema.
    expect(decodeUser(result.user)).toEqual(result.user);
    expect(result.signedIn.id).toBe(result.created.id);
  });
});
