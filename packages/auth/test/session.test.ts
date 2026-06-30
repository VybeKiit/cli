import { describe, expect, it } from 'vitest';
import { LOCAL_DEV_SESSION_TOKEN, createLocalAuthProvider } from '../src/index';

describe('createLocalAuthProvider sessions', () => {
  it('signInWithPassword returns user + session token', async () => {
    const result = await createLocalAuthProvider().signInWithPassword('anyone@x.com', 'whatever');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.user).toEqual({ id: 'local-dev-user', email: 'you@local.dev' });
      expect(result.value.sessionToken).toBe(LOCAL_DEV_SESSION_TOKEN);
    }
  });

  it('getUser accepts the dev session token', async () => {
    const provider = createLocalAuthProvider();
    const signedIn = await provider.signInWithPassword('a@b.com', 'pw');
    expect(signedIn.ok).toBe(true);
    if (!signedIn.ok) return;
    const me = await provider.getUser(signedIn.value.sessionToken);
    expect(me.ok && me.value.email).toBe('you@local.dev');
  });
});
