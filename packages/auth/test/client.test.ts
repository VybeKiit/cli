import { describe, expect, it, vi } from 'vitest';
import { createAuthClient } from '../src/client';
import { ok } from '@vybekiit/core';

describe('createAuthClient', () => {
  it('signs in via postJson', async () => {
    const postJson = vi.fn(async () => ok({ id: '1', email: 'a@b.c' }));
    const client = createAuthClient(postJson);
    const result = await client.signInWithPassword('a@b.c', 'secret');
    expect(result.ok).toBe(true);
    expect(postJson).toHaveBeenCalledWith('/api/auth/signin', {
      email: 'a@b.c',
      password: 'secret',
    });
  });

  it('validates empty credentials', async () => {
    const postJson = vi.fn();
    const client = createAuthClient(postJson);
    const result = await client.signInWithPassword('', '');
    expect(result.ok).toBe(false);
    expect(postJson).not.toHaveBeenCalled();
  });
});
