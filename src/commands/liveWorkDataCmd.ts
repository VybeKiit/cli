import { resolve } from 'node:path';
import process from 'node:process';
import { caughtMessage } from '@vybekiit/core';
import {
  type DataLadderProvider,
  type DataLiveWorkResult,
  dataLiveWorkErrorEvent,
  dataLiveWorkJourneyEvents,
  isDataLadderProvider,
  LiveWorkError,
  type LiveWorkMode,
  runDataLiveWork,
} from '@vybekiit/db';
import { Effect, Either } from 'effect';
import { loadEnvFile, mergeEnv, writeEnvKeys } from '../doctor/env';
import { hasBoolFlag, readFlagValue } from '../lib/argvFlags';

const LIVE_WORK_MODES = ['demo', 'dogfood', 'buyer'] as const satisfies readonly LiveWorkMode[];

/**
 * Public JSON payload for `vybekiit live-work data` — never includes secret values.
 */
export type LiveWorkDataPublicResult = {
  readonly ok: true;
  readonly provider: DataLadderProvider;
  readonly ephemeral: boolean;
  readonly hopped: boolean;
  readonly fromProvider?: DataLadderProvider;
  readonly skipped: readonly DataLadderProvider[];
  readonly verified: true;
  readonly buyerMessage: string;
  /** Env keys written (names only — values never printed). */
  readonly pinKeys: readonly string[];
  readonly pinned: boolean;
  readonly claimUrl?: string;
  readonly claimableId?: string;
  /** Rail-compatible tool events (no secrets). */
  readonly events: readonly {
    readonly name: string;
    readonly phase: 'start' | 'end' | 'error';
    readonly detail?: string;
  }[];
};

type LiveWorkDataFailure = {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
  readonly hopClass: string;
  readonly provider?: DataLadderProvider;
};

type LiveWorkDataCommandResult = {
  readonly json: string;
  readonly exitCode: number;
};

/**
 * True when `value` is a supported Live work mode.
 *
 * @param value - Candidate mode string.
 * @returns Whether the value is a Live work mode.
 * @example
 * isLiveWorkMode('demo') === true;
 */
const isLiveWorkMode = (value: string): value is LiveWorkMode =>
  (LIVE_WORK_MODES as readonly string[]).includes(value);

/**
 * Parse flags for `live-work data`.
 *
 * @param args - CLI arguments after `live-work data`.
 * @returns Mode, optional named vendor, cwd, and pin toggle.
 */
export const parseLiveWorkDataFlags = (
  args: readonly string[],
): {
  readonly mode: LiveWorkMode;
  readonly vendor?: DataLadderProvider;
  readonly cwd: string;
  readonly pin: boolean;
  readonly preferExisting: boolean;
  readonly error?: string;
} => {
  const modeRaw = readFlagValue(args, 'mode') ?? 'demo';
  const vendorRaw = readFlagValue(args, 'vendor');
  const cwdRaw = readFlagValue(args, 'cwd');
  const cwd = resolve(process.cwd(), cwdRaw === undefined || cwdRaw === '' ? '.' : cwdRaw);

  if (!isLiveWorkMode(modeRaw)) {
    return {
      mode: 'demo',
      cwd,
      pin: true,
      preferExisting: true,
      error: `Unknown mode "${modeRaw}". Use demo, dogfood, or buyer.`,
    };
  }

  if (vendorRaw !== undefined && vendorRaw !== '' && !isDataLadderProvider(vendorRaw)) {
    return {
      mode: modeRaw,
      cwd,
      pin: true,
      preferExisting: true,
      error: `Unknown vendor "${vendorRaw}". Use supabase, neon, or railway.`,
    };
  }

  return {
    mode: modeRaw,
    cwd,
    pin: !hasBoolFlag(args, 'no-pin'),
    preferExisting: !hasBoolFlag(args, 'fresh'),
    ...(vendorRaw !== undefined && vendorRaw !== '' && isDataLadderProvider(vendorRaw)
      ? { vendor: vendorRaw }
      : {}),
  };
};

/**
 * Strip secrets from a successful Live work result for agent/CLI stdout.
 *
 * @param result - Full package result (may contain DATABASE_URL).
 * @param pinned - Whether pin keys were written to `.env`.
 * @returns Public JSON-safe payload.
 */
export const publicLiveWorkDataResult = (
  liveWork: DataLiveWorkResult,
  pinned: boolean,
): LiveWorkDataPublicResult => {
  const publicResult: {
    ok: true;
    provider: DataLadderProvider;
    ephemeral: boolean;
    hopped: boolean;
    skipped: readonly DataLadderProvider[];
    verified: true;
    buyerMessage: string;
    pinKeys: readonly string[];
    pinned: boolean;
    events: LiveWorkDataPublicResult['events'];
    fromProvider?: DataLadderProvider;
    claimUrl?: string;
    claimableId?: string;
  } = {
    ok: true,
    provider: liveWork.provider,
    ephemeral: liveWork.ephemeral,
    hopped: liveWork.hopped,
    skipped: liveWork.skipped,
    verified: true,
    buyerMessage: liveWork.buyerMessage,
    pinKeys: Object.keys(liveWork.pin),
    pinned,
    events: dataLiveWorkJourneyEvents(liveWork),
  };
  if (liveWork.fromProvider !== undefined) {
    publicResult.fromProvider = liveWork.fromProvider;
  }
  if (typeof liveWork.claimUrl === 'string' && liveWork.claimUrl.length > 0) {
    publicResult.claimUrl = liveWork.claimUrl;
  }
  if (typeof liveWork.claimableId === 'string' && liveWork.claimableId.length > 0) {
    publicResult.claimableId = liveWork.claimableId;
  }
  return publicResult;
};

/**
 * Map a Live work tagged error to CLI failure JSON.
 *
 * @param error - Package LiveWorkError.
 * @returns Failure payload (no secrets).
 */
const liveWorkDataFailure = (error: LiveWorkError): LiveWorkDataFailure => {
  const failure: {
    ok: false;
    code: string;
    message: string;
    hopClass: string;
    provider?: DataLadderProvider;
  } = {
    ok: false,
    code: error.code,
    message: error.message,
    hopClass: error.hopClass,
  };
  if (error.provider !== undefined) {
    failure.provider = error.provider;
  }
  return failure;
};

/**
 * Process env merged with project `.env` for Live work.
 *
 * @param cwd - Absolute project directory.
 * @returns Merged environment; file values win.
 * @example
 * const liveWorkEnv = liveWorkEnvFromProject('/tmp/app');
 */
const liveWorkEnvFromProject = (cwd: string): Record<string, string | undefined> =>
  mergeEnv(process.env, loadEnvFile(cwd));

/**
 * Write pin keys into project `.env` via the doctor-secure path (ADR-0039).
 *
 * @param cwd - Project directory.
 * @param keys - Pin key map (may include secrets).
 * @returns Effect that fails as LiveWorkError on IO failure.
 */
const writeDataPin = (
  cwd: string,
  keys: Record<string, string>,
): Effect.Effect<void, LiveWorkError> =>
  Effect.try({
    try: () => {
      writeEnvKeys(cwd, keys);
    },
    catch: (cause) =>
      new LiveWorkError({
        code: 'pin_write_failed',
        message: caughtMessage(cause, 'Failed to write pin keys'),
        hopClass: 'hard_stop',
      }),
  });

/**
 * Run data Live work: preference ladder → provision → verify → pin (ADR-0039).
 * Shared SSOT for buyer skills (`save-data`) and local-dev console.
 *
 * Usage: `vybekiit live-work data [--mode=demo|dogfood|buyer] [--vendor=supabase|neon|railway]
 * [--cwd=dir] [--no-pin] [--fresh]`
 *
 * @param args - Arguments after `live-work data`.
 * @returns JSON stdout payload and process exit code.
 */
export const runLiveWorkData = async (
  args: readonly string[],
): Promise<LiveWorkDataCommandResult> => {
  const flags = parseLiveWorkDataFlags(args);
  if (flags.error !== undefined) {
    return {
      json: JSON.stringify({ ok: false, code: 'invalid_args', message: flags.error }, null, 2),
      exitCode: 1,
    };
  }

  const liveWorkEnv = liveWorkEnvFromProject(flags.cwd);
  const either = await Effect.runPromise(
    Effect.either(
      runDataLiveWork({
        mode: flags.mode,
        env: liveWorkEnv,
        preferExisting: flags.preferExisting,
        cwd: flags.cwd,
        ...(flags.vendor === undefined ? {} : { namedVendor: flags.vendor }),
        ...(flags.pin
          ? {
              writePin: (keys: Record<string, string>) => writeDataPin(flags.cwd, keys),
            }
          : {}),
      }),
    ),
  );

  if (Either.isLeft(either)) {
    const failure = liveWorkDataFailure(either.left);
    return {
      json: JSON.stringify(
        {
          ...failure,
          events: [dataLiveWorkErrorEvent(failure.code, failure.message)],
        },
        null,
        2,
      ),
      exitCode: 1,
    };
  }

  return {
    json: JSON.stringify(publicLiveWorkDataResult(either.right, flags.pin), null, 2),
    exitCode: 0,
  };
};
