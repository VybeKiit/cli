import { describe, expect, it } from 'vitest';
import {
  sendEmailCode,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
} from '../authClient';
import { startCheckout } from '../billingClient';
import { DEV_USER, signInFailureHandler } from '../../test/msw/handlers';
import { mswServer } from '../../test/msw/server';

describe('auth-client (MSW)', () => {
  it('signInWithPassword returns the user the route resolved', async () => {
    const result = await signInWithPassword('you@local.dev', 'whatever');
    expect(result.ok && result.value).toEqual(DEV_USER);
  });

  it('signUpWithPassword returns the user the route resolved', async () => {
    const result = await signUpWithPassword('you@local.dev', 'whatever');
    expect(result.ok && result.value).toEqual(DEV_USER);
  });

  it('sendEmailCode succeeds when the route accepts the request', async () => {
    const result = await sendEmailCode('you@local.dev');
    expect(result.ok && result.value).toBe(true);
  });

  it('verifyEmailCode returns the signed-in user', async () => {
    const result = await verifyEmailCode('you@local.dev', '000000');
    expect(result.ok && result.value).toEqual(DEV_USER);
  });

  it('validates input before hitting the network', async () => {
    const result = await signInWithPassword('', '');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_input');
  });

  it('surfaces a route failure as a Result error (not a throw)', async () => {
    mswServer.use(signInFailureHandler());
    const result = await signInWithPassword('you@local.dev', 'nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('Wrong password.');
  });
});

describe('billing-client (MSW)', () => {
  it('startCheckout returns the practice checkout url', async () => {
    const result = await startCheckout('plan_pro');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.url).toContain('checkout/practice');
  });

  it('requires a plan id before hitting the network', async () => {
    const result = await startCheckout('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_input');
  });
});
