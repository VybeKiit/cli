import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { createLocalAuthProvider } from '../src/providers/local/index';
import { LOCAL_DEV_SESSION_TOKEN } from '../src/session';

const DEV_USER = { id: 'local-dev-user', email: 'you@local.dev' };

describe('createLocalAuthProvider', () => {
  it('reports its provider name and capabilities', () => {
    const provider = createLocalAuthProvider();
    expect(provider.name).toBe('local');
    expect(provider.capabilities.sms).toBe(true);
  });

  it('signUpWithPassword returns the fixed dev session for any credentials', async () => {
    const session = await Effect.runPromise(
      createLocalAuthProvider().signUpWithPassword('anyone@x.com', 'whatever'),
    );
    expect(session.user).toEqual(DEV_USER);
    expect(session.sessionToken).toBe(LOCAL_DEV_SESSION_TOKEN);
  });

  it('signInWithPassword returns the fixed dev session for any credentials', async () => {
    const session = await Effect.runPromise(
      createLocalAuthProvider().signInWithPassword('anyone@x.com', 'whatever'),
    );
    expect(session.user).toEqual(DEV_USER);
  });

  it('sendEmailCode always succeeds (no real mail in practice mode)', async () => {
    const value = await Effect.runPromise(createLocalAuthProvider().sendEmailCode('anyone@x.com'));
    expect(value).toBe(true);
  });

  it('verifyEmailCode accepts any code and returns the dev session', async () => {
    const session = await Effect.runPromise(
      createLocalAuthProvider().verifyEmailCode('anyone@x.com', '000000'),
    );
    expect(session.user).toEqual(DEV_USER);
  });

  it('getUser returns the dev user for any non-empty session token', async () => {
    const user = await Effect.runPromise(createLocalAuthProvider().getUser('any-session-token'));
    expect(user).toEqual(DEV_USER);
  });

  it('getUser fails with no_user for an empty token', async () => {
    const error = await Effect.runPromise(Effect.flip(createLocalAuthProvider().getUser('')));
    expect(error.code).toBe('no_user');
  });

  it('requestPasswordReset succeeds in practice mode', async () => {
    const value = await Effect.runPromise(
      createLocalAuthProvider().requestPasswordReset('anyone@x.com'),
    );
    expect(value).toBe(true);
  });

  it('resetPassword accepts local-reset-token', async () => {
    const provider = createLocalAuthProvider();
    await Effect.runPromise(provider.requestPasswordReset('anyone@x.com'));
    const session = await Effect.runPromise(provider.resetPassword('local-reset-token', 'newpass'));
    expect(session.user).toEqual(DEV_USER);
  });

  it('sendMagicLink and verifyMagicLink work in practice mode', async () => {
    const provider = createLocalAuthProvider();
    await Effect.runPromise(provider.sendMagicLink('anyone@x.com'));
    const session = await Effect.runPromise(provider.verifyMagicLink('local-magic-token'));
    expect(session.user).toEqual(DEV_USER);
  });

  it('sendSmsCode and verifySmsCode work in practice mode', async () => {
    const provider = createLocalAuthProvider();
    await Effect.runPromise(provider.sendSmsCode('+15551234567'));
    const session = await Effect.runPromise(provider.verifySmsCode('+15551234567', '000000'));
    expect(session.user).toEqual(DEV_USER);
  });
});
