import { type AuthClientPostJson, createAuthClient } from '@vybekiit/auth/client';
import { ok } from '@vybekiit/core';
import { describe, expect, it, vi } from 'vitest';

describe('createAuthClient', () => {
  it('signs in via postJson', async () => {
    const postJson = vi.fn(async () => ok({ id: '1', email: 'a@b.c' })) as AuthClientPostJson;
    const client = createAuthClient(postJson);
    const result = await client.signInWithPassword('a@b.c', 'secret');
    expect(result.ok).toBe(true);
    expect(postJson).toHaveBeenCalledWith('/api/auth/signin', {
      email: 'a@b.c',
      password: 'secret',
    });
  });

  it('validates empty credentials', async () => {
    const postJson = vi.fn() as AuthClientPostJson;
    const client = createAuthClient(postJson);
    const result = await client.signInWithPassword('', '');
    expect(result.ok).toBe(false);
    expect(postJson).not.toHaveBeenCalled();
  });
});
