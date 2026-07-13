import type { EnvSource } from '@vybekiit/core';
import { Effect } from 'effect';
import { shouldContinuePaymentsLadder } from './hopSignals';
import { resolvePaymentsLadderOrder } from './ladders';
import { buildPaymentsPinKeys, buyerPaymentsSuccessMessage } from './pin';
import type { PaymentsLadderProvider, PaymentsLiveWorkResult, ProvisionedPayments } from './types';
import { PaymentsLiveWorkError } from './types';
import { detectExistingPayments, verifyPaymentsCredentials } from './verifyCredentials';

/**
 * One try on the payments preference ladder.
 */
export type PaymentsLadderStep = {
  readonly provider: PaymentsLadderProvider;
  readonly tryVerify: (
    ctx: PaymentsLadderStepContext,
  ) => Effect.Effect<ProvisionedPayments, PaymentsLiveWorkError>;
};

/**
 * Context passed into each payments ladder step.
 */
export type PaymentsLadderStepContext = {
  readonly env: EnvSource;
};

/**
 * Options for {@link runPaymentsLiveWork}.
 */
export type RunPaymentsLiveWorkOptions = {
  readonly env?: EnvSource;
  readonly mode: 'demo' | 'dogfood' | 'buyer';
  readonly namedVendor?: PaymentsLadderProvider | null;
  readonly steps?: readonly PaymentsLadderStep[];
  readonly writePin?: (keys: Record<string, string>) => Effect.Effect<void, PaymentsLiveWorkError>;
  /** When true (default), existing pin + keys wins without re-walking the ladder. */
  readonly preferExisting?: boolean;
};

/**
 * Default ladder steps — env credential presence for each money rail.
 */
export const defaultPaymentsLadderSteps: readonly PaymentsLadderStep[] = [
  {
    provider: 'lemon-squeezy',
    tryVerify: (ctx) => verifyPaymentsCredentials('lemon-squeezy', ctx.env),
  },
  {
    provider: 'stripe',
    tryVerify: (ctx) => verifyPaymentsCredentials('stripe', ctx.env),
  },
  {
    provider: 'paypal',
    tryVerify: (ctx) => verifyPaymentsCredentials('paypal', ctx.env),
  },
];

type FinishArgs = {
  readonly provisioned: ProvisionedPayments;
  readonly hopped: boolean;
  readonly fromProvider?: PaymentsLadderProvider;
  readonly skipped: readonly PaymentsLadderProvider[];
  readonly writePin?: (keys: Record<string, string>) => Effect.Effect<void, PaymentsLiveWorkError>;
};

/**
 * Pin + assemble success result.
 *
 * @param args - Winner and hop metadata.
 * @returns Effect of public result (no secrets in pin).
 */
const finishSuccess = (
  args: FinishArgs,
): Effect.Effect<PaymentsLiveWorkResult, PaymentsLiveWorkError> =>
  Effect.gen(function* () {
    const pin = buildPaymentsPinKeys(args.provisioned);
    if (args.writePin) {
      yield* args.writePin(pin);
    }
    const result: {
      provider: PaymentsLadderProvider;
      ephemeral: false;
      hopped: boolean;
      skipped: readonly PaymentsLadderProvider[];
      pin: Record<string, string>;
      verified: true;
      buyerMessage: string;
      fromProvider?: PaymentsLadderProvider;
    } = {
      provider: args.provisioned.provider,
      ephemeral: false,
      hopped: args.hopped,
      skipped: args.skipped,
      pin,
      verified: true,
      buyerMessage: buyerPaymentsSuccessMessage(
        args.provisioned.provider,
        args.hopped,
        args.fromProvider,
      ),
    };
    if (args.fromProvider !== undefined) {
      result.fromProvider = args.fromProvider;
    }
    return result;
  });

/**
 * Walk the payments preference ladder.
 *
 * @param order - Ladder order.
 * @param ctx - Step context.
 * @param steps - Provider steps.
 * @param namedStick - When true, never hop.
 * @param writePin - Optional pin writer.
 * @returns Effect of verified success or ladder failure.
 */
const walkLadder = (
  order: readonly PaymentsLadderProvider[],
  ctx: PaymentsLadderStepContext,
  steps: readonly PaymentsLadderStep[],
  namedStick: boolean,
  writePin: FinishArgs['writePin'],
): Effect.Effect<PaymentsLiveWorkResult, PaymentsLiveWorkError> =>
  Effect.gen(function* () {
    const stepByProvider = new Map(steps.map((step) => [step.provider, step]));
    const skipped: PaymentsLadderProvider[] = [];
    let freeTierFrom: PaymentsLadderProvider | undefined;
    let lastHopClass: string | undefined;

    for (const provider of order) {
      const step = stepByProvider.get(provider);
      if (step === undefined) {
        skipped.push(provider);
      } else {
        const attempt = yield* step.tryVerify(ctx).pipe(Effect.either);
        if (attempt._tag === 'Right') {
          const provisioned = attempt.right;
          const hoppedAway = freeTierFrom !== undefined;
          return yield* finishSuccess({
            provisioned,
            hopped: hoppedAway,
            skipped,
            ...(hoppedAway && freeTierFrom !== undefined ? { fromProvider: freeTierFrom } : {}),
            ...(writePin === undefined ? {} : { writePin }),
          });
        }

        const error = attempt.left;
        lastHopClass = error.hopClass;
        if (namedStick || !shouldContinuePaymentsLadder(error.hopClass)) {
          return yield* Effect.fail(error);
        }
        if (
          freeTierFrom === undefined &&
          (error.hopClass === 'quota' || error.hopClass === 'onboarding_blocked')
        ) {
          freeTierFrom = provider;
        }
        skipped.push(provider);
      }
    }

    return yield* Effect.fail(
      new PaymentsLiveWorkError({
        code: 'ladder_exhausted',
        message: `Payments preference ladder exhausted${lastHopClass ? ` (last: ${lastHopClass})` : ''}`,
        hopClass: 'hard_stop',
      }),
    );
  });

/**
 * Run payments Live work: preference ladder → verify credentials → pin (ADR-0039).
 * Does not create vendor accounts. Existing pin + keys wins. Hop only on
 * quota / onboarding-blocked (e.g. Lemon Squeezy not ready) / missing credentials.
 *
 * @param options - Mode, env, optional named vendor and pin writer.
 * @returns Effect of verified result with public pin keys only.
 * @example
 * const result = await Effect.runPromise(
 *   runPaymentsLiveWork({ mode: 'buyer', env: process.env }),
 * );
 */
export const runPaymentsLiveWork = (
  options: RunPaymentsLiveWorkOptions,
): Effect.Effect<PaymentsLiveWorkResult, PaymentsLiveWorkError> =>
  Effect.gen(function* () {
    const env = options.env ?? {};
    const preferExisting = options.preferExisting !== false;

    if (preferExisting && options.namedVendor === undefined) {
      const existing = detectExistingPayments(env);
      if (existing !== null) {
        return yield* finishSuccess({
          provisioned: existing,
          hopped: false,
          skipped: [],
          ...(options.writePin === undefined ? {} : { writePin: options.writePin }),
        });
      }
    }

    const ctx: PaymentsLadderStepContext = { env };

    return yield* walkLadder(
      resolvePaymentsLadderOrder(env, options.namedVendor),
      ctx,
      options.steps ?? defaultPaymentsLadderSteps,
      options.namedVendor !== undefined && options.namedVendor !== null,
      options.writePin,
    );
  });
