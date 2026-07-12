import {
  AUTH_CLIENT_ROUTES,
  type AuthClientPostJson,
  createAuthClient,
} from '@vybekiit/auth/client';
import { AUTH_ROUTES } from '@vybekiit/auth/http';
import type { AuthError } from '@vybekiit/auth/types';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

describe('createAuthClient', () => {
  it('signs in via postJson', async () => {
    const postJson = vi.fn(<T>() =>
      Effect.succeed({ id: '1', email: 'a@b.c' } as T),
    ) as AuthClientPostJson<AuthError>;
    const client = createAuthClient(postJson);
    const result = await Effect.runPromise(client.signInWithPassword('a@b.c', 'secret'));
    expect(result).toEqual({ id: '1', email: 'a@b.c' });
    expect(postJson).toHaveBeenCalledWith('/api/auth/signin', {
      email: 'a@b.c',
      password: 'secret',
    });
  });

  it('validates empty credentials', async () => {
    const postJson = vi.fn(<T>() => Effect.succeed({} as T)) as AuthClientPostJson<AuthError>;
    const client = createAuthClient(postJson);
    const result = await Effect.runPromise(Effect.flip(client.signInWithPassword('', '')));
    expect(result.code).toBe('invalid_input');
    expect(postJson).not.toHaveBeenCalled();
  });

  it('resets a password via the new route', async () => {
    const postJson = vi.fn(<T>() =>
      Effect.succeed({ id: '1', email: 'a@b.c' } as T),
    ) as AuthClientPostJson<AuthError>;
    const client = createAuthClient(postJson);
    const result = await Effect.runPromise(client.resetPassword('tok', 'new-pw'));
    expect(result).toEqual({ id: '1', email: 'a@b.c' });
    expect(postJson).toHaveBeenCalledWith('/api/auth/reset-password', {
      token: 'tok',
      newPassword: 'new-pw',
    });
  });

  it('points every client route at a registered auth endpoint', () => {
    const registered = new Set(AUTH_ROUTES.map((route) => route.path));
    for (const path of Object.values(AUTH_CLIENT_ROUTES)) {
      expect(registered).toContain(path);
    }
  });
});
