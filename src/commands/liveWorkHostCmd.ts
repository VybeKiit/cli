import { resolve } from 'node:path';
import process from 'node:process';
import { caughtMessage } from '@vybekiit/core';
import {
  type HostLadderProvider,
  HostLiveWorkError,
  type HostLiveWorkResult,
  isHostLadderProvider,
  type LiveWorkMode,
  runHostLiveWork,
} from '@vybekiit/deploy';
import { Effect, Either } from 'effect';
import { loadEnvFile, mergeEnv, writeEnvKeys } from '../doctor/env';
import { hasBoolFlag, readFlagValue } from '../lib/argvFlags';

const LIVE_WORK_MODES = ['demo', 'dogfood', 'buyer'] as const satisfies readonly LiveWorkMode[];

/**
 * Public JSON for `vybekiit live-work host` — never includes secrets.
 */
export type LiveWorkHostPublicResult = {
  readonly ok: true;
  readonly provider: HostLadderProvider;
  readonly ephemeral: boolean;
  readonly hopped: boolean;
  readonly fromProvider?: HostLadderProvider;
  readonly skipped: readonly HostLadderProvider[];
  readonly verified: true;
  readonly buyerMessage: string;
  readonly pinKeys: readonly string[];
  readonly pinned: boolean;
  readonly url?: string;
};

type LiveWorkHostCommandResult = {
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
 * Parse flags for `live-work host`.
 *
 * @param args - CLI args after `live-work host`.
 * @returns Parsed flags.
 */
export const parseLiveWorkHostFlags = (
  args: readonly string[],
): {
  readonly mode: LiveWorkMode;
  readonly vendor?: HostLadderProvider;
  readonly cwd: string;
  readonly pin: boolean;
  readonly preferExisting: boolean;
  readonly outputDir?: string;
  readonly projectName?: string;
  readonly error?: string;
} => {
  const modeRaw = readFlagValue(args, 'mode') ?? 'buyer';
  const vendorRaw = readFlagValue(args, 'vendor');
  const cwdRaw = readFlagValue(args, 'cwd');
  const outputDirRaw = readFlagValue(args, 'output-dir');
  const projectNameRaw = readFlagValue(args, 'project-name');
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

  if (vendorRaw !== undefined && vendorRaw !== '' && !isHostLadderProvider(vendorRaw)) {
    return {
      mode: modeRaw,
      cwd,
      pin: true,
      preferExisting: true,
      error: `Unknown vendor "${vendorRaw}". Use cloudflare, render, railway, vercel, netlify, or github-pages.`,
    };
  }

  return {
    mode: modeRaw,
    cwd,
    pin: !hasBoolFlag(args, 'no-pin'),
    preferExisting: !hasBoolFlag(args, 'fresh'),
    ...(vendorRaw !== undefined && vendorRaw !== '' && isHostLadderProvider(vendorRaw)
      ? { vendor: vendorRaw }
      : {}),
    ...(outputDirRaw !== undefined && outputDirRaw !== ''
      ? { outputDir: resolve(cwd, outputDirRaw) }
      : {}),
    ...(projectNameRaw !== undefined && projectNameRaw !== ''
      ? { projectName: projectNameRaw }
      : {}),
  };
};

/**
 * Public success payload (no secrets).
 *
 * @param result - Package result.
 * @param pinned - Whether pin was written.
 * @returns Public JSON-safe result.
 */
export const publicLiveWorkHostResult = (
  liveWork: HostLiveWorkResult,
  pinned: boolean,
): LiveWorkHostPublicResult => {
  const publicResult: LiveWorkHostPublicResult = {
    ok: true,
    provider: liveWork.provider,
    ephemeral: liveWork.ephemeral,
    hopped: liveWork.hopped,
    skipped: liveWork.skipped,
    verified: true,
    buyerMessage: liveWork.buyerMessage,
    pinKeys: Object.keys(liveWork.pin),
    pinned,
    ...(liveWork.fromProvider === undefined ? {} : { fromProvider: liveWork.fromProvider }),
    ...(typeof liveWork.url === 'string' ? { url: liveWork.url } : {}),
  };
  return publicResult;
};

/**
 * Write host pin keys into project `.env`.
 *
 * @param cwd - Project directory.
 * @param keys - Pin map.
 * @returns Effect.
 */
const writeHostPin = (
  cwd: string,
  keys: Record<string, string>,
): Effect.Effect<void, HostLiveWorkError> =>
  Effect.try({
    try: () => {
      writeEnvKeys(cwd, keys);
    },
    catch: (cause) =>
      new HostLiveWorkError({
        code: 'pin_write_failed',
        message: caughtMessage(cause, 'Failed to write pin keys'),
        hopClass: 'hard_stop',
      }),
  });

/**
 * Run host Live work: preference ladder → existing pin or create (create adapters landing).
 *
 * Usage: `vybekiit live-work host [--mode=demo|dogfood|buyer]
 * [--vendor=cloudflare|render|railway|vercel|netlify|github-pages] [--cwd=dir] [--output-dir=dir]
 * [--project-name=name] [--no-pin] [--fresh]`
 *
 * @param args - Arguments after `live-work host`.
 * @returns JSON stdout payload and exit code.
 */
export const runLiveWorkHost = async (
  args: readonly string[],
): Promise<LiveWorkHostCommandResult> => {
  const flags = parseLiveWorkHostFlags(args);
  if (flags.error !== undefined) {
    return {
      json: JSON.stringify({ ok: false, code: 'invalid_args', message: flags.error }, null, 2),
      exitCode: 1,
    };
  }

  const env = mergeEnv(process.env, loadEnvFile(flags.cwd));
  const either = await Effect.runPromise(
    Effect.either(
      runHostLiveWork({
        mode: flags.mode,
        env,
        preferExisting: flags.preferExisting,
        cwd: flags.cwd,
        ...(flags.vendor === undefined ? {} : { namedVendor: flags.vendor }),
        ...(flags.outputDir === undefined ? {} : { outputDir: flags.outputDir }),
        ...(flags.projectName === undefined ? {} : { projectName: flags.projectName }),
        ...(flags.pin
          ? {
              writePin: (keys: Record<string, string>) => writeHostPin(flags.cwd, keys),
            }
          : {}),
      }),
    ),
  );

  if (Either.isLeft(either)) {
    const error = either.left;
    return {
      json: JSON.stringify(
        {
          ok: false,
          code: error.code,
          message: error.message,
          hopClass: error.hopClass,
          ...(error.provider === undefined ? {} : { provider: error.provider }),
        },
        null,
        2,
      ),
      exitCode: 1,
    };
  }

  return {
    json: JSON.stringify(publicLiveWorkHostResult(either.right, flags.pin), null, 2),
    exitCode: 0,
  };
};
