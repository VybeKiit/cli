import type { EnvSource } from '@vybekiit/core';
import { Effect } from 'effect';
import {
  type DataLadderStep,
  type DataLadderStepContext,
  defaultDataLadderSteps,
  verifyProvisionedData,
} from './defaultSteps';
import { shouldContinueLadder } from './hopSignals';
import { resolveDataLadderOrder } from './ladders';
import { cleanupOrphans, orphanFromProvisioned } from './orphanCleanup';
import { buildDataPinKeys, buyerDataSuccessMessage } from './pin';
import {
  type DataLadderProvider,
  type DataLiveWorkResult,
  LiveWorkError,
  type LiveWorkMode,
  makeProvisioned,
  type OrphanHandle,
  type ProvisionedData,
} from './types';

/** Default neon.new referrer for kit Live work. */
export const DEFAULT_LIVE_WORK_REF = 'vybekiit-live-work';

/**
 * Options for {@link runDataLiveWork}.
 */
export type RunDataLiveWorkOptions = {
  readonly env?: EnvSource;
  readonly mode: LiveWorkMode;
  /** Named vendor stick — only this adapter; no hop (ADR-0039). */
  readonly namedVendor?: DataLadderProvider | null;
  /** neon.new `ref` for claimable create. */
  readonly ref?: string;
  /** Optional fetch for claimable Neon (tests). */
  readonly fetchImpl?: typeof fetch;
  /** Injectable steps (defaults to package adapters). */
  readonly steps?: readonly DataLadderStep[];
  /**
   * Write pin keys to root `.env` (doctor-secure path). When omitted, keys are
   * returned on the result only — caller must persist.
   */
  readonly writePin?: (keys: Record<string, string>) => Effect.Effect<void, LiveWorkError>;
  /**
   * When true (default), skip ladder and use existing healthy primary if
   * DATABASE_URL or Supabase keys already work for the active pin.
   */
  readonly preferExisting?: boolean;
  /** Project cwd for Railway CLI create (A9). */
  readonly cwd?: string;
  /** Injectable Railway CLI (tests). */
  readonly railwayCli?: import('./railwayProvision').RailwayCliRunner;
  /** Railway project name when auto-init is required (A9). */
  readonly railwayProjectName?: string;
};

type FinishArgs = {
  readonly provisioned: ProvisionedData;
  readonly hopped: boolean;
  readonly fromProvider?: DataLadderProvider;
  readonly skipped: readonly DataLadderProvider[];
  readonly writePin?: (keys: Record<string, string>) => Effect.Effect<void, LiveWorkError>;
  /** Existing AUTH_PROVIDER so companion pin does not overwrite (A14). */
  readonly existingAuthProvider?: string;
  /** Partial resources left after hop — cleaned best-effort before celebrate (A10). */
  readonly orphans?: readonly OrphanHandle[];
};

/**
 * Detect an already-working primary data connection (ADR-0039: existing wins).
 *
 * @param env - Raw environment.
 * @returns Provisioned snapshot when a primary is already configured, else null.
 */
const detectExistingPrimary = (env: EnvSource): ProvisionedData | null => {
  let databaseUrl: string | null = null;
  if (typeof env.DATABASE_URL === 'string' && env.DATABASE_URL.length > 0) {
    databaseUrl = env.DATABASE_URL;
  }
  const pin = typeof env.DATA_PROVIDER === 'string' ? env.DATA_PROVIDER : null;

  if (databaseUrl !== null && (pin === 'neon' || pin === 'railway')) {
    const optional: {
      databaseUrl: string;
      claimUrl?: string;
      claimableId?: string;
    } = { databaseUrl };
    if (typeof env.PUBLIC_POSTGRES_CLAIM_URL === 'string') {
      optional.claimUrl = env.PUBLIC_POSTGRES_CLAIM_URL;
    }
    if (typeof env.CLAIMABLE_POSTGRES_ID === 'string') {
      optional.claimableId = env.CLAIMABLE_POSTGRES_ID;
    }
    return makeProvisioned({ provider: pin, ephemeral: false }, optional);
  }

  if (
    pin === 'supabase' &&
    typeof env.SUPABASE_URL === 'string' &&
    env.SUPABASE_URL.length > 0 &&
    typeof env.SUPABASE_ANON_KEY === 'string' &&
    env.SUPABASE_ANON_KEY.length > 0
  ) {
    return makeProvisioned(
      { provider: 'supabase', ephemeral: false },
      databaseUrl === null ? {} : { databaseUrl },
    );
  }

  if (databaseUrl !== null && pin === null) {
    return makeProvisioned({ provider: 'neon', ephemeral: false }, { databaseUrl });
  }

  return null;
};

/**
 * Pin + assemble success result after verify (and best-effort orphan cleanup).
 *
 * @param args - Winner and hop metadata.
 * @returns Effect of the public result shape.
 */
const finishSuccess = (args: FinishArgs): Effect.Effect<DataLiveWorkResult, LiveWorkError> =>
  Effect.gen(function* () {
    if (args.orphans !== undefined && args.orphans.length > 0) {
      yield* cleanupOrphans(args.orphans);
    }
    const pin = buildDataPinKeys(
      args.provisioned,
      args.existingAuthProvider === undefined
        ? {}
        : { existingAuthProvider: args.existingAuthProvider },
    );
    if (args.writePin) {
      yield* args.writePin(pin);
    }
    return buildResult(args.provisioned, pin, args);
  });

/**
 * Assemble {@link DataLiveWorkResult} without writing `undefined` optionals.
 *
 * @param provisioned - Winner.
 * @param pin - Env keys to persist.
 * @param args - Hop metadata.
 * @returns Public success result.
 */
const buildResult = (
  provisioned: ProvisionedData,
  pin: Record<string, string>,
  args: FinishArgs,
): DataLiveWorkResult => {
  const result: {
    provider: DataLadderProvider;
    ephemeral: boolean;
    hopped: boolean;
    skipped: readonly DataLadderProvider[];
    pin: Record<string, string>;
    verified: true;
    buyerMessage: string;
    databaseUrl?: string;
    claimUrl?: string;
    claimableId?: string;
    fromProvider?: DataLadderProvider;
  } = {
    provider: provisioned.provider,
    ephemeral: provisioned.ephemeral,
    hopped: args.hopped,
    skipped: args.skipped,
    pin,
    verified: true,
    buyerMessage: buyerDataSuccessMessage(provisioned.provider, args.hopped, args.fromProvider),
  };
  if (provisioned.databaseUrl !== undefined) {
    result.databaseUrl = provisioned.databaseUrl;
  }
  if (provisioned.claimUrl !== undefined) {
    result.claimUrl = provisioned.claimUrl;
  }
  if (provisioned.claimableId !== undefined) {
    result.claimableId = provisioned.claimableId;
  }
  if (args.fromProvider !== undefined) {
    result.fromProvider = args.fromProvider;
  }
  return result;
};

/**
 * Walk the preference ladder until a step provisions and verifies.
 *
 * @param order - Ladder order for this run.
 * @param ctx - Step context.
 * @param steps - Provider step implementations.
 * @param namedStick - When true, never hop past a failure.
 * @param writePin - Optional pin writer.
 * @param existingAuthProvider - Existing AUTH_PROVIDER for companion pin (A14).
 * @returns Effect of verified success or ladder failure.
 */
const walkLadder = (
  order: readonly DataLadderProvider[],
  ctx: DataLadderStepContext,
  steps: readonly DataLadderStep[],
  namedStick: boolean,
  writePin: FinishArgs['writePin'],
  existingAuthProvider: string | undefined,
): Effect.Effect<DataLiveWorkResult, LiveWorkError> =>
  Effect.gen(function* () {
    const stepByProvider = new Map(steps.map((step) => [step.provider, step]));
    const skipped: DataLadderProvider[] = [];
    const orphans: OrphanHandle[] = [];
    /** Provider left after a free-tier hop (quota / onboarding_blocked only). */
    let freeTierFrom: DataLadderProvider | undefined;
    let lastHopClass: string | undefined;

    for (const provider of order) {
      const step = stepByProvider.get(provider);
      if (step === undefined) {
        skipped.push(provider);
      } else {
        const attempt = yield* step.tryProvision(ctx).pipe(Effect.either);
        if (attempt._tag === 'Right') {
          const provisioned = attempt.right;
          const verified = yield* verifyProvisionedData(provisioned).pipe(Effect.either);
          if (verified._tag === 'Left') {
            // Partial resource + failed ready-check — clean ephemeral, then stop (verify is hard_stop).
            orphans.push(orphanFromProvisioned(provisioned, 'verify failed'));
            yield* cleanupOrphans(orphans);
            return yield* Effect.fail(verified.left);
          }
          const hoppedAway = freeTierFrom !== undefined;
          const finish: FinishArgs = {
            provisioned,
            hopped: hoppedAway,
            skipped,
            orphans,
            ...(hoppedAway && freeTierFrom !== undefined ? { fromProvider: freeTierFrom } : {}),
            ...(writePin === undefined ? {} : { writePin }),
            ...(existingAuthProvider === undefined ? {} : { existingAuthProvider }),
          };
          return yield* finishSuccess(finish);
        }

        const error = attempt.left;
        lastHopClass = error.hopClass;
        if (error.orphan !== undefined) {
          orphans.push(error.orphan);
        }
        if (namedStick || !shouldContinueLadder(error.hopClass)) {
          if (orphans.length > 0) {
            yield* cleanupOrphans(orphans);
          }
          return yield* Effect.fail(error);
        }
        // Free-tier hop signal — buyer message names this vendor as the one we left.
        if (
          freeTierFrom === undefined &&
          (error.hopClass === 'quota' || error.hopClass === 'onboarding_blocked')
        ) {
          freeTierFrom = provider;
        }
        skipped.push(provider);
      }
    }

    if (orphans.length > 0) {
      yield* cleanupOrphans(orphans);
    }
    return yield* Effect.fail(
      new LiveWorkError({
        code: 'ladder_exhausted',
        message: `Data preference ladder exhausted${lastHopClass ? ` (last: ${lastHopClass})` : ''}`,
        hopClass: 'hard_stop',
      }),
    );
  });

/**
 * Run data Live work: preference ladder → provision → verify → pin (ADR-0039).
 * Shared SSOT for local-dev console and buyer skills.
 *
 * @param options - Mode, env, optional named vendor and pin writer.
 * @returns Effect of verified result with pin keys.
 * @example
 * const result = await Effect.runPromise(
 *   runDataLiveWork({ mode: 'demo', env: process.env, writePin: … }),
 * );
 */
export const runDataLiveWork = (
  options: RunDataLiveWorkOptions,
): Effect.Effect<DataLiveWorkResult, LiveWorkError> =>
  Effect.gen(function* () {
    const env = options.env ?? {};
    const preferExisting = options.preferExisting !== false;
    let existingAuthProvider: string | undefined;
    if (typeof env.AUTH_PROVIDER === 'string' && env.AUTH_PROVIDER.length > 0) {
      existingAuthProvider = env.AUTH_PROVIDER;
    }

    if (preferExisting && options.namedVendor === undefined) {
      const existing = detectExistingPrimary(env);
      if (existing !== null) {
        yield* verifyProvisionedData(existing);
        return yield* finishSuccess({
          provisioned: existing,
          hopped: false,
          skipped: [],
          ...(options.writePin === undefined ? {} : { writePin: options.writePin }),
          ...(existingAuthProvider === undefined ? {} : { existingAuthProvider }),
        });
      }
    }

    const ctx: DataLadderStepContext = {
      env,
      mode: options.mode,
      ref: options.ref ?? DEFAULT_LIVE_WORK_REF,
      ...(options.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl }),
      ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
      ...(options.railwayCli === undefined ? {} : { railwayCli: options.railwayCli }),
      ...(options.railwayProjectName === undefined
        ? {}
        : { railwayProjectName: options.railwayProjectName }),
    };

    return yield* walkLadder(
      resolveDataLadderOrder(env, options.namedVendor),
      ctx,
      options.steps ?? defaultDataLadderSteps,
      options.namedVendor !== undefined && options.namedVendor !== null,
      options.writePin,
      existingAuthProvider,
    );
  });
