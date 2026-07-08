import { Effect, Either } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  sendEmailCode,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
} from '@/lib/authClient';
import { startCheckout } from '@/lib/billingClient';
import { DEV_USER, signInFailureHandler } from '@/test/msw/handlers';
import { mswServer } from '@/test/msw/server';

const runClient = <A, E>(program: Effect.Effect<A, E>): Promise<Either.Either<A, E>> =>
  Effect.runPromise(Effect.either(program));

describe('auth-client (MSW)', () => {
  it('signInWithPassword returns the user the route resolved', async () => {
    const result = await runClient(signInWithPassword('you@local.dev', 'whatever'));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toEqual(DEV_USER);
    }
  });

  it('signUpWithPassword returns the user the route resolved', async () => {
    const result = await runClient(signUpWithPassword('you@local.dev', 'whatever'));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toEqual(DEV_USER);
    }
  });

  it('sendEmailCode succeeds when the route accepts the request', async () => {
    const result = await runClient(sendEmailCode('you@local.dev'));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toBe(true);
    }
  });

  it('verifyEmailCode returns the signed-in user', async () => {
    const result = await runClient(verifyEmailCode('you@local.dev', '000000'));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toEqual(DEV_USER);
    }
  });

  it('validates input before hitting the network', async () => {
    const result = await runClient(signInWithPassword('', ''));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left.code).toBe('invalid_input');
    }
  });

  it('surfaces a route failure as an Effect failure', async () => {
    mswServer.use(signInFailureHandler());
    const result = await runClient(signInWithPassword('you@local.dev', 'nope'));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left.message).toBe('Wrong password.');
    }
  });
});

describe('billing-client (MSW)', () => {
  it('startCheckout returns the practice checkout url', async () => {
    const result = await runClient(startCheckout('plan_pro'));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.url).toContain('checkout/practice');
    }
  });

  it('requires a plan id before hitting the network', async () => {
    const result = await runClient(startCheckout(''));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) {
      expect(result.left.code).toBe('invalid_input');
    }
  });
});
