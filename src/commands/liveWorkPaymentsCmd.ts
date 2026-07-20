import { resolve } from 'node:path';
import process from 'node:process';
import { caughtMessage } from '@vybekiit/core';
import {
  isPaymentsLadderProvider,
  type LiveWorkMode,
  type PaymentsLadderProvider,
  PaymentsLiveWorkError,
  type PaymentsLiveWorkResult,
  runPaymentsLiveWork,
  toPaymentsLiveWorkErrorEvent,
  toPaymentsLiveWorkJourneyEvents,
} from '@vybekiit/payments';
import { Effect, Either } from 'effect';
import { loadEnvFile, mergeEnv, writeEnvKeys } from '../doctor/env';
import { hasBoolFlag, readFlagValue } from '../lib/argvFlags';

const LIVE_WORK_MODES = ['demo', 'dogfood', 'buyer'] as const satisfies readonly LiveWorkMode[];

/**
 * Public JSON for `vybekiit live-work payments` — never includes secrets.
 */
export type LiveWorkPaymentsPublicResult = {
  readonly ok: true;
  readonly provider: PaymentsLadderProvider;
  readonly ephemeral: false;
  readonly hopped: boolean;
  readonly fromProvider?: PaymentsLadderProvider;
  readonly skipped: readonly PaymentsLadderProvider[];
  readonly verified: true;
  readonly buyerMessage: string;
  readonly pinKeys: readonly string[];
  readonly pinned: boolean;
  /** Rail-compatible tool events (no secrets). */
  readonly events: readonly {
    readonly name: string;
    readonly phase: 'start' | 'end' | 'error';
    readonly detail?: string;
  }[];
};

type LiveWorkPaymentsCommandResult = {
  readonly json: string;
  readonly exitCode: number;
};

/**
 * True when value is a Live work mode.
 *
 * @param value - Candidate.
 * @returns Mode guard.
 */
const isLiveWorkMode = (value: string): value is LiveWorkMode =>
  (LIVE_WORK_MODES as readonly string[]).includes(value);

/**
 * Parse flags for `live-work payments`.
 *
 * @param args - CLI args after `live-work payments`.
 * @returns Parsed flags.
 */
export const parseLiveWorkPaymentsFlags = (
  args: readonly string[],
): {
  readonly mode: LiveWorkMode;
  readonly vendor?: PaymentsLadderProvider;
  readonly cwd: string;
  readonly pin: boolean;
  readonly preferExisting: boolean;
  readonly error?: string;
} => {
  const modeRaw = readFlagValue(args, 'mode') ?? 'buyer';
  const vendorRaw = readFlagValue(args, 'vendor');
  const cwdRaw = readFlagValue(args, 'cwd');
  const cwd = resolve(process.cwd(), cwdRaw === undefined || cwdRaw === '' ? '.' : cwdRaw);

  if (!isLiveWorkMode(modeRaw)) {
    return {
      mode: 'buyer',
      cwd,
      pin: true,
      preferExisting: true,
      error: `Unknown mode "${modeRaw}". Use demo, dogfood, or buyer.`,
    };
  }

  if (vendorRaw !== undefined && vendorRaw !== '' && !isPaymentsLadderProvider(vendorRaw)) {
    return {
      mode: modeRaw,
      cwd,
      pin: true,
      preferExisting: true,
      error: `Unknown vendor "${vendorRaw}". Use lemon-squeezy, stripe, or paypal.`,
    };
  }

  return {
    mode: modeRaw,
    cwd,
    pin: !hasBoolFlag(args, 'no-pin'),
    preferExisting: !hasBoolFlag(args, 'fresh'),
    ...(vendorRaw !== undefined && vendorRaw !== '' && isPaymentsLadderProvider(vendorRaw)
      ? { vendor: vendorRaw }
      : {}),
  };
};

/**
 * Public success payload (pin key names only — never secret values).
 *
 * @param result - Package result.
 * @param pinned - Whether pin was written.
 * @returns Public JSON-safe result.
 */
export const toPublicLiveWorkPaymentsResult = (
  result: PaymentsLiveWorkResult,
  pinned: boolean,
): LiveWorkPaymentsPublicResult => ({
  ok: true,
  provider: result.provider,
  ephemeral: false,
  hopped: result.hopped,
  skipped: result.skipped,
  verified: true,
  buyerMessage: result.buyerMessage,
  pinKeys: Object.keys(result.pin),
  pinned,
  events: [...toPaymentsLiveWorkJourneyEvents(result)],
  ...(result.fromProvider === undefined ? {} : { fromProvider: result.fromProvider }),
});

/**
 * Write payments pin keys into project `.env`.
 *
 * @param cwd - Project directory.
 * @param keys - Pin map (public provider id only).
 * @returns Effect.
 */
const writePaymentsPin = (
  cwd: string,
  keys: Record<string, string>,
): Effect.Effect<void, PaymentsLiveWorkError> =>
  Effect.try({
    try: () => {
      writeEnvKeys(cwd, keys);
    },
    catch: (cause) =>
      new PaymentsLiveWorkError({
        code: 'pin_write_failed',
        message: caughtMessage(cause, 'Failed to write pin keys'),
        hopClass: 'hard_stop',
      }),
  });

/**
 * Run payments Live work: preference ladder → verify credentials → pin (ADR-0039).
 *
 * Usage: `vybekiit live-work payments [--mode=demo|dogfood|buyer]
 * [--vendor=lemon-squeezy|stripe|paypal] [--cwd=dir] [--no-pin] [--fresh]`
 *
 * Does not create vendor accounts. Existing pin + keys wins. Secrets never appear
 * in stdout JSON (only `pinKeys` names).
 *
 * @param args - Arguments after `live-work payments`.
 * @returns JSON stdout payload and exit code.
 */
export const runLiveWorkPayments = async (
  args: readonly string[],
): Promise<LiveWorkPaymentsCommandResult> => {
  const flags = parseLiveWorkPaymentsFlags(args);
  if (flags.error !== undefined) {
    return {
      json: JSON.stringify({ ok: false, code: 'invalid_args', message: flags.error }, null, 2),
      exitCode: 1,
    };
  }

  const env = mergeEnv(process.env, loadEnvFile(flags.cwd));
  const either = await Effect.runPromise(
    Effect.either(
      runPaymentsLiveWork({
        mode: flags.mode,
        env,
        preferExisting: flags.preferExisting,
        ...(flags.vendor === undefined ? {} : { namedVendor: flags.vendor }),
        ...(flags.pin
          ? {
              writePin: (keys: Record<string, string>) => writePaymentsPin(flags.cwd, keys),
            }
          : {}),
      }),
    ),
  );

  if (Either.isLeft(either)) {
    const error = either.left;
    const event = toPaymentsLiveWorkErrorEvent(error.code, error.message);
    return {
      json: JSON.stringify(
        {
          ok: false,
          code: error.code,
          message: error.message,
          hopClass: error.hopClass,
          events: [event],
          ...(error.provider === undefined ? {} : { provider: error.provider }),
        },
        null,
        2,
      ),
      exitCode: 1,
    };
  }

  return {
    json: JSON.stringify(toPublicLiveWorkPaymentsResult(either.right, flags.pin), null, 2),
    exitCode: 0,
  };
};
