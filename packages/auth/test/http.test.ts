import type { AuthHttpDeps } from '@vybekiit/auth/http/handlers';
import { handleMe, handleSignIn } from '@vybekiit/auth/http/handlers';
import { LOCAL_DEV_SESSION_TOKEN } from '@vybekiit/auth/session';
import type { AuthProvider } from '@vybekiit/auth/types';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

function deps(overrides: Partial<AuthHttpDeps> & { provider: AuthProvider }): AuthHttpDeps {
  const sessionToken = { current: null as string | null };
  return {
    resolveAuth: () => overrides.provider,
    session: {
      setSession: async (token: string) => {
        sessionToken.current = token;
      },
      readSession: async () => sessionToken.current,
      clearSession: async () => {
        sessionToken.current = null;
      },
      ...overrides.session,
    },
    telemetry: {
      trackAuthEvent: vi.fn(),
      captureAuthRejection: vi.fn(),
      captureAuthFailure: vi.fn(),
      ...overrides.telemetry,
    },
  };
}

describe('auth http handlers', () => {
  it('handleSignIn persists sessionToken and returns user only', async () => {
    const provider = {
      signInWithPassword: vi.fn().mockReturnValue(
        Effect.succeed({
          user: { id: 'u1', email: 'a@b.com' },
          sessionToken: 'bearer-token',
        }),
      ),
    } as unknown as AuthProvider;

    const httpDeps = deps({ provider });
    const response = await handleSignIn({ email: 'a@b.com', password: 'pw' }, httpDeps);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(await httpDeps.session.readSession()).toBe('bearer-token');
  });

  it('handleMe reads cookie token and calls getUser', async () => {
    const provider = {
      getUser: vi.fn().mockReturnValue(Effect.succeed({ id: 'u1', email: 'a@b.com' })),
    } as unknown as AuthProvider;

    const httpDeps = deps({
      provider,
      session: {
        setSession: async () => {},
        readSession: async () => LOCAL_DEV_SESSION_TOKEN,
        clearSession: async () => {},
      },
    });

    const response = await handleMe(httpDeps);
    expect(response.status).toBe(200);
    expect(provider.getUser).toHaveBeenCalledWith(LOCAL_DEV_SESSION_TOKEN);
  });
});
