import { createLocalAuthProvider, LOCAL_DEV_SESSION_TOKEN } from '@vybekiit/auth';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

describe('createLocalAuthProvider sessions', () => {
  it('signInWithPassword returns user + session token', async () => {
    const session = await Effect.runPromise(
      createLocalAuthProvider().signInWithPassword('anyone@x.com', 'whatever'),
    );
    expect(session.user).toEqual({ id: 'local-dev-user', email: 'you@local.dev' });
    expect(session.sessionToken).toBe(LOCAL_DEV_SESSION_TOKEN);
  });

  it('getUser accepts the dev session token', async () => {
    const provider = createLocalAuthProvider();
    const signedIn = await Effect.runPromise(provider.signInWithPassword('a@b.com', 'pw'));
    const me = await Effect.runPromise(provider.getUser(signedIn.sessionToken));
    expect(me.email).toBe('you@local.dev');
  });
});
