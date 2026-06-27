import { describe, expect, it } from 'vitest';
import {
  sendEmailCode,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
} from '../auth-client';

describe('auth-client stubs', () => {
  it('signInWithPassword rejects empty credentials with invalid_input', async () => {
    const result = await signInWithPassword('', '');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_input');
  });

  it('signInWithPassword returns not_configured until add-signin runs', async () => {
    const result = await signInWithPassword('a@b.com', 'secret123');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not_configured');
  });

  it('signUpWithPassword returns not_configured for valid input', async () => {
    const result = await signUpWithPassword('a@b.com', 'secret123');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not_configured');
  });

  it('sendEmailCode rejects an empty email and is not configured otherwise', async () => {
    const empty = await sendEmailCode('');
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error.code).toBe('invalid_input');

    const valid = await sendEmailCode('a@b.com');
    expect(valid.ok).toBe(false);
    if (!valid.ok) expect(valid.error.code).toBe('not_configured');
  });

  it('verifyEmailCode rejects missing code and is not configured otherwise', async () => {
    const missing = await verifyEmailCode('a@b.com', '');
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.error.code).toBe('invalid_input');

    const valid = await verifyEmailCode('a@b.com', '123456');
    expect(valid.ok).toBe(false);
    if (!valid.ok) expect(valid.error.code).toBe('not_configured');
  });
});
