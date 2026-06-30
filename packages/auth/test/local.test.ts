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
    const result = await createLocalAuthProvider().signUpWithPassword('anyone@x.com', 'whatever');
    expect(result.ok && result.value.user).toEqual(DEV_USER);
    expect(result.ok && result.value.sessionToken).toBe(LOCAL_DEV_SESSION_TOKEN);
  });

  it('signInWithPassword returns the fixed dev session for any credentials', async () => {
    const result = await createLocalAuthProvider().signInWithPassword('anyone@x.com', 'whatever');
    expect(result.ok && result.value.user).toEqual(DEV_USER);
  });

  it('sendEmailCode always succeeds (no real mail in practice mode)', async () => {
    const result = await createLocalAuthProvider().sendEmailCode('anyone@x.com');
    expect(result.ok && result.value).toBe(true);
  });

  it('verifyEmailCode accepts any code and returns the dev session', async () => {
    const result = await createLocalAuthProvider().verifyEmailCode('anyone@x.com', '000000');
    expect(result.ok && result.value.user).toEqual(DEV_USER);
  });

  it('getUser returns the dev user for any non-empty session token', async () => {
    const result = await createLocalAuthProvider().getUser('any-session-token');
    expect(result.ok && result.value).toEqual(DEV_USER);
  });

  it('getUser fails with no_user for an empty token', async () => {
    const result = await createLocalAuthProvider().getUser('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('no_user');
  });

  it('requestPasswordReset succeeds in practice mode', async () => {
    const result = await createLocalAuthProvider().requestPasswordReset('anyone@x.com');
    expect(result.ok && result.value).toBe(true);
  });

  it('resetPassword accepts local-reset-token', async () => {
    const provider = createLocalAuthProvider();
    await provider.requestPasswordReset('anyone@x.com');
    const result = await provider.resetPassword('local-reset-token', 'newpass');
    expect(result.ok && result.value.user).toEqual(DEV_USER);
  });

  it('sendMagicLink and verifyMagicLink work in practice mode', async () => {
    const provider = createLocalAuthProvider();
    await provider.sendMagicLink('anyone@x.com');
    const result = await provider.verifyMagicLink('local-magic-token');
    expect(result.ok && result.value.user).toEqual(DEV_USER);
  });

  it('sendSmsCode and verifySmsCode work in practice mode', async () => {
    const provider = createLocalAuthProvider();
    await provider.sendSmsCode('+15551234567');
    const result = await provider.verifySmsCode('+15551234567', '000000');
    expect(result.ok && result.value.user).toEqual(DEV_USER);
  });
});
