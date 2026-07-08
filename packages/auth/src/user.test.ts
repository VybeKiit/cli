import { normalizeAuthUser } from '@vybekiit/auth/user';
import { describe, expect, it } from 'vitest';

describe('normalizeAuthUser', () => {
  it('maps a valid provider user', () => {
    expect(normalizeAuthUser({ id: 'u1', email: 'a@b.com' })).toEqual({
      id: 'u1',
      email: 'a@b.com',
    });
  });

  it('defaults a missing email to null', () => {
    expect(normalizeAuthUser({ id: 'u1' })).toEqual({ id: 'u1', email: null });
  });

  it('returns null when there is no id', () => {
    expect(normalizeAuthUser(null)).toBeNull();
    expect(normalizeAuthUser({ email: 'a@b.com' })).toBeNull();
  });
});
