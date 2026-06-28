import { describe, expect, it } from 'vitest';
import { createLocalAuthProvider } from '../src/providers/local';

const DEV_USER = { id: 'local-dev-user', email: 'you@local.dev' };

describe('createLocalAuthProvider', () => {
  it('reports its provider name', () => {
    expect(createLocalAuthProvider().name).toBe('local');
  });

  it('signUpWithPassword returns the fixed dev user for any credentials', async () => {
    const result = await createLocalAuthProvider().signUpWithPassword('anyone@x.com', 'whatever');
    expect(result.ok && result.value).toEqual(DEV_USER);
  });

  it('signInWithPassword returns the fixed dev user for any credentials', async () => {
    const result = await createLocalAuthProvider().signInWithPassword('anyone@x.com', 'whatever');
    expect(result.ok && result.value).toEqual(DEV_USER);
  });

  it('sendEmailCode always succeeds (no real mail in practice mode)', async () => {
    const result = await createLocalAuthProvider().sendEmailCode('anyone@x.com');
    expect(result.ok && result.value).toBe(true);
  });

  it('verifyEmailCode accepts any code and returns the dev user', async () => {
    const result = await createLocalAuthProvider().verifyEmailCode('anyone@x.com', '000000');
    expect(result.ok && result.value).toEqual(DEV_USER);
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
});
