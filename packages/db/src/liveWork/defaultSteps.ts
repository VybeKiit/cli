import { type EnvSource, isSupabaseUnconfigured } from '@vybekiit/core';
import { Effect } from 'effect';
import { createClaimableNeon, verifyDatabaseUrl } from './claimableNeon';
import { createRailwayPostgres, type RailwayCliRunner } from './railwayProvision';
import {
  type DataLadderProvider,
  LiveWorkError,
  type LiveWorkMode,
  makeProvisioned,
  type ProvisionedData,
} from './types';

/**
 * Context passed into each ladder step.
 */
export type DataLadderStepContext = {
  readonly env: EnvSource;
  readonly mode: LiveWorkMode;
  readonly ref: string;
  readonly fetchImpl?: typeof fetch;
  /** Project cwd for Railway CLI (optional). */
  readonly cwd?: string;
  /** Injectable Railway CLI for tests. */
  readonly railwayCli?: RailwayCliRunner;
  /** Optional Railway project name when auto-init is needed. */
  readonly railwayProjectName?: string;
};

/**
 * One try on the data preference ladder.
 */
export type DataLadderStep = {
  readonly provider: DataLadderProvider;
  readonly tryProvision: (
    ctx: DataLadderStepContext,
  ) => Effect.Effect<ProvisionedData, LiveWorkError>;
};

/**
 * Non-empty DATABASE_URL from env, or null.
 *
 * @param env - Raw environment.
 * @returns Connection string when present.
 */
const readDatabaseUrl = (env: EnvSource): string | null => {
  const value = env.DATABASE_URL;
  return typeof value === 'string' && value.length > 0 ? value : null;
};

/**
 * Fail with missing_credentials so the orchestrator skips to the next ladder entry.
 *
 * @param provider - Ladder provider that cannot run.
 * @returns Effect that always fails hop-class missing_credentials.
 */
const missingCredentials = (provider: DataLadderProvider): Effect.Effect<never, LiveWorkError> =>
  Effect.fail(
    new LiveWorkError({
      code: 'missing_credentials',
      message: `${provider} credentials are not configured`,
      hopClass: 'missing_credentials',
      provider,
    }),
  );

/**
 * Supabase step: use existing keys when present; otherwise skip (no project create in v1 slice).
 *
 * @param ctx - Ladder step context.
 * @returns Existing Supabase pin or missing_credentials.
 */
const trySupabase = (ctx: DataLadderStepContext): Effect.Effect<ProvisionedData, LiveWorkError> => {
  if (isSupabaseUnconfigured(ctx.env)) {
    return missingCredentials('supabase');
  }
  return Effect.succeed(makeProvisioned({ provider: 'supabase', ephemeral: false }));
};

/**
 * Neon step: claimable for demo/dogfood; existing DATABASE_URL for any mode; else skip.
 *
 * @param ctx - Ladder step context.
 * @returns Provisioned Neon or hop-classed failure.
 */
const tryNeon = (ctx: DataLadderStepContext): Effect.Effect<ProvisionedData, LiveWorkError> => {
  const existing = readDatabaseUrl(ctx.env);

  if (existing !== null && ctx.env.DATA_PROVIDER === 'neon') {
    const optional: {
      databaseUrl: string;
      claimUrl?: string;
      claimableId?: string;
    } = { databaseUrl: existing };
    if (typeof ctx.env.PUBLIC_POSTGRES_CLAIM_URL === 'string') {
      optional.claimUrl = ctx.env.PUBLIC_POSTGRES_CLAIM_URL;
    }
    if (typeof ctx.env.CLAIMABLE_POSTGRES_ID === 'string') {
      optional.claimableId = ctx.env.CLAIMABLE_POSTGRES_ID;
    }
    return Effect.succeed(makeProvisioned({ provider: 'neon', ephemeral: false }, optional));
  }

  if (ctx.mode === 'demo' || ctx.mode === 'dogfood') {
    const options =
      ctx.fetchImpl === undefined ? { ref: ctx.ref } : { ref: ctx.ref, fetchImpl: ctx.fetchImpl };
    return createClaimableNeon(options);
  }

  if (existing !== null) {
    return Effect.succeed(
      makeProvisioned({ provider: 'neon', ephemeral: false }, { databaseUrl: existing }),
    );
  }

  return missingCredentials('neon');
};

/**
 * Railway step: reuse DATABASE_URL when present; else CLI create when logged in (A9).
 *
 * @param ctx - Ladder step context.
 * @returns Provisioned Railway or hop-classed failure (missing_credentials when no CLI/login).
 */
const tryRailway = (ctx: DataLadderStepContext): Effect.Effect<ProvisionedData, LiveWorkError> => {
  const existing = readDatabaseUrl(ctx.env);
  if (existing !== null) {
    return Effect.succeed(
      makeProvisioned({ provider: 'railway', ephemeral: false }, { databaseUrl: existing }),
    );
  }

  return createRailwayPostgres({
    ...(ctx.cwd === undefined ? {} : { cwd: ctx.cwd }),
    ...(ctx.railwayCli === undefined ? {} : { runCli: ctx.railwayCli }),
    ...(ctx.railwayProjectName === undefined ? {} : { projectName: ctx.railwayProjectName }),
  });
};

/**
 * Default data ladder steps for Live work (ADR-0039 first vertical).
 */
export const defaultDataLadderSteps: readonly DataLadderStep[] = [
  { provider: 'supabase', tryProvision: trySupabase },
  { provider: 'neon', tryProvision: tryNeon },
  { provider: 'railway', tryProvision: tryRailway },
];

/**
 * Verify provisioned data is reachable when a connection string exists.
 * Supabase-with-keys-only succeeds without URL (keys already imply a live project config).
 *
 * @param provisioned - Winner before celebrate.
 * @returns Effect true when ready.
 */
export const verifyProvisionedData = (
  provisioned: ProvisionedData,
): Effect.Effect<true, LiveWorkError> => {
  if (typeof provisioned.databaseUrl === 'string' && provisioned.databaseUrl.length > 0) {
    return verifyDatabaseUrl(provisioned.databaseUrl);
  }
  if (provisioned.provider === 'supabase') {
    return Effect.succeed(true as const);
  }
  return Effect.fail(
    new LiveWorkError({
      code: 'verify_failed',
      message: 'No connection string to verify',
      hopClass: 'hard_stop',
      provider: provisioned.provider,
    }),
  );
};
