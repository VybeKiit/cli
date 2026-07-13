import { resolve } from 'node:path';
import process from 'node:process';
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
 * @example
 * parseLiveWorkHostFlags(['--mode=buyer', '--cwd=./app']);
 */
export const parseLiveWorkHostFlags = (
  args: readonly string[],
): {
  readonly mode: LiveWorkMode;
  readonly vendor?: HostLadderProvider;
  readonly cwd: string;
  readonly pin: boolean;
  readonly preferExisting: boolean;
  readonly buildDir?: string;
  readonly projectName?: string;
  readonly error?: string;
} => {
  const modeRaw = readFlagValue(args, 'mode') ?? 'buyer';
  const vendorRaw = readFlagValue(args, 'vendor');
  const cwdRaw = readFlagValue(args, 'cwd');
  const buildDirRaw = readFlagValue(args, 'build-dir');
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
    ...(buildDirRaw !== undefined && buildDirRaw !== ''
      ? { buildDir: resolve(cwd, buildDirRaw) }
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
export const toPublicLiveWorkHostResult = (
  result: HostLiveWorkResult,
  pinned: boolean,
): LiveWorkHostPublicResult => {
  const publicResult: LiveWorkHostPublicResult = {
    ok: true,
    provider: result.provider,
    ephemeral: result.ephemeral,
    hopped: result.hopped,
    skipped: result.skipped,
    verified: true,
    buyerMessage: result.buyerMessage,
    pinKeys: Object.keys(result.pin),
    pinned,
    ...(result.fromProvider === undefined ? {} : { fromProvider: result.fromProvider }),
    ...(typeof result.url === 'string' ? { url: result.url } : {}),
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
        message: cause instanceof Error ? cause.message : 'Failed to write pin keys',
        hopClass: 'hard_stop',
      }),
  });

/**
 * Run host Live work: preference ladder → existing pin or create (create adapters landing).
 *
 * Usage: `vybekiit live-work host [--mode=demo|dogfood|buyer]
 * [--vendor=cloudflare|render|railway|vercel|netlify|github-pages] [--cwd=dir] [--build-dir=dir]
 * [--project-name=name] [--no-pin] [--fresh]`
 *
 * @param args - Arguments after `live-work host`.
 * @returns JSON stdout payload and exit code.
 * @example
 * const result = await runLiveWorkHost(['--mode=buyer', '--cwd=./app']);
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
        ...(flags.buildDir === undefined ? {} : { buildDir: flags.buildDir }),
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
    json: JSON.stringify(toPublicLiveWorkHostResult(either.right, flags.pin), null, 2),
    exitCode: 0,
  };
};
