import type { EnvSource } from '@vybekiit/core';
import { Effect } from 'effect';
import { createCloudflarePagesHost, type WranglerCliRunner } from './cloudflareProvision';
import { type CreateGithubPagesHostOptions, createGithubPagesHost } from './githubPagesProvision';
import { shouldContinueHostLadder } from './hopSignals';
import { resolveHostLadderOrder } from './ladders';
import { type CreateNetlifyHostOptions, createNetlifyHost } from './netlifyProvision';
import { buildHostPinKeys, buyerHostSuccessMessage } from './pin';
import { createRailwayHost, type RailwayHostCliRunner } from './railwayHostProvision';
import { type CreateRenderHostOptions, createRenderHost } from './renderProvision';
import {
  type HostLadderProvider,
  HostLiveWorkError,
  type HostLiveWorkResult,
  type LiveWorkMode,
  makeProvisionedHost,
  type ProvisionedHost,
} from './types';
import { createVercelHost, type VercelCliRunner } from './vercelProvision';

/**
 * One try on the host preference ladder.
 */
export type HostLadderStep = {
  readonly provider: HostLadderProvider;
  readonly tryProvision: (
    ctx: HostLadderStepContext,
  ) => Effect.Effect<ProvisionedHost, HostLiveWorkError>;
};

/**
 * Context passed into each host ladder step.
 */
export type HostLadderStepContext = {
  readonly env: EnvSource;
  readonly mode: LiveWorkMode;
  readonly cwd?: string;
  readonly buildDir?: string;
  readonly projectName?: string;
  readonly wranglerCli?: WranglerCliRunner;
  readonly vercelCli?: VercelCliRunner;
  readonly railwayHostCli?: RailwayHostCliRunner;
  readonly renderCreateService?: CreateRenderHostOptions['createService'];
  readonly netlifyCreateSite?: CreateNetlifyHostOptions['createSite'];
  readonly githubPagesCreate?: CreateGithubPagesHostOptions['createPages'];
  readonly fetchImpl?: typeof fetch;
};

/**
 * Options for {@link runHostLiveWork}.
 */
export type RunHostLiveWorkOptions = {
  readonly env?: EnvSource;
  readonly mode: LiveWorkMode;
  readonly namedVendor?: HostLadderProvider | null;
  readonly steps?: readonly HostLadderStep[];
  readonly writePin?: (keys: Record<string, string>) => Effect.Effect<void, HostLiveWorkError>;
  readonly preferExisting?: boolean;
  /** Project directory (demo site parent / wrangler cwd). */
  readonly cwd?: string;
  /** Static assets directory for Cloudflare Pages deploy. */
  readonly buildDir?: string;
  /** Pages / host project name. */
  readonly projectName?: string;
  /** Injectable wrangler CLI (tests). */
  readonly wranglerCli?: WranglerCliRunner;
  /** Injectable vercel CLI (tests). */
  readonly vercelCli?: VercelCliRunner;
  /** Injectable railway CLI for host create (tests). */
  readonly railwayHostCli?: RailwayHostCliRunner;
  /** Injectable Render create seam (tests). */
  readonly renderCreateService?: CreateRenderHostOptions['createService'];
  /** Injectable Netlify create seam (tests). */
  readonly netlifyCreateSite?: CreateNetlifyHostOptions['createSite'];
  /** Injectable GitHub Pages create seam (tests). */
  readonly githubPagesCreate?: CreateGithubPagesHostOptions['createPages'];
  /** Injectable fetch for host ready-check. */
  readonly fetchImpl?: typeof fetch;
};

/**
 * Detect an already-working host pin (ADR-0039: existing wins).
 * v1: HOSTING_PROVIDER + APP_URL present counts as existing (full deploy verify later).
 *
 * @param env - Raw environment.
 * @returns Provisioned snapshot or null.
 */
const detectExistingHost = (env: EnvSource): ProvisionedHost | null => {
  const pin = typeof env.HOSTING_PROVIDER === 'string' ? env.HOSTING_PROVIDER : null;
  if (pin === null) {
    return null;
  }
  if (
    pin !== 'cloudflare' &&
    pin !== 'render' &&
    pin !== 'railway' &&
    pin !== 'vercel' &&
    pin !== 'netlify' &&
    pin !== 'github-pages'
  ) {
    return null;
  }
  const url = env.APP_URL;
  if (typeof url !== 'string' || url.length === 0) {
    return null;
  }
  return makeProvisionedHost({ provider: pin, ephemeral: false }, { url });
};

/**
 * Cloudflare Pages create/deploy via wrangler (A12 first host adapter).
 *
 * @param ctx - Ladder context (mode, build dir, CLI).
 * @returns Provisioned host or hop-classed error.
 */
const tryCloudflare = (
  ctx: HostLadderStepContext,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  createCloudflarePagesHost({
    mode: ctx.mode,
    ...(ctx.projectName === undefined ? {} : { projectName: ctx.projectName }),
    ...(ctx.buildDir === undefined ? {} : { buildDir: ctx.buildDir }),
    ...(ctx.cwd === undefined ? {} : { cwd: ctx.cwd }),
    ...(ctx.wranglerCli === undefined ? {} : { runCli: ctx.wranglerCli }),
    ...(ctx.fetchImpl === undefined ? {} : { fetchImpl: ctx.fetchImpl }),
  });

/**
 * Render static-site create via API (A12b).
 *
 * @param ctx - Ladder context.
 * @returns Provisioned host or hop-classed error.
 */
const tryRender = (ctx: HostLadderStepContext): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  createRenderHost({
    mode: ctx.mode,
    env: ctx.env,
    ...(ctx.projectName === undefined ? {} : { projectName: ctx.projectName }),
    ...(ctx.buildDir === undefined ? {} : { buildDir: ctx.buildDir }),
    ...(ctx.cwd === undefined ? {} : { cwd: ctx.cwd }),
    ...(ctx.fetchImpl === undefined ? {} : { fetchImpl: ctx.fetchImpl }),
    ...(ctx.renderCreateService === undefined ? {} : { createService: ctx.renderCreateService }),
  });

/**
 * Railway host create via CLI (A12b).
 *
 * @param ctx - Ladder context.
 * @returns Provisioned host or hop-classed error.
 */
const tryRailway = (
  ctx: HostLadderStepContext,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  createRailwayHost({
    mode: ctx.mode,
    ...(ctx.projectName === undefined ? {} : { projectName: ctx.projectName }),
    ...(ctx.buildDir === undefined ? {} : { buildDir: ctx.buildDir }),
    ...(ctx.cwd === undefined ? {} : { cwd: ctx.cwd }),
    ...(ctx.railwayHostCli === undefined ? {} : { runCli: ctx.railwayHostCli }),
    ...(ctx.fetchImpl === undefined ? {} : { fetchImpl: ctx.fetchImpl }),
  });

/**
 * Vercel host create via CLI (A12b).
 *
 * @param ctx - Ladder context.
 * @returns Provisioned host or hop-classed error.
 */
const tryVercel = (
  ctx: HostLadderStepContext,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> => {
  const rawToken = ctx.env.VERCEL_TOKEN;
  let token: string | undefined;
  if (typeof rawToken === 'string' && rawToken.length > 0) {
    token = rawToken;
  }
  return createVercelHost({
    mode: ctx.mode,
    ...(ctx.projectName === undefined ? {} : { projectName: ctx.projectName }),
    ...(ctx.buildDir === undefined ? {} : { buildDir: ctx.buildDir }),
    ...(ctx.cwd === undefined ? {} : { cwd: ctx.cwd }),
    ...(token === undefined ? {} : { token }),
    ...(ctx.vercelCli === undefined ? {} : { runCli: ctx.vercelCli }),
    ...(ctx.fetchImpl === undefined ? {} : { fetchImpl: ctx.fetchImpl }),
  });
};

/**
 * Netlify static-site create via REST API.
 *
 * @param ctx - Ladder context.
 * @returns Provisioned host or hop-classed error.
 */
const tryNetlify = (
  ctx: HostLadderStepContext,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  createNetlifyHost({
    mode: ctx.mode,
    env: ctx.env,
    ...(ctx.projectName === undefined ? {} : { projectName: ctx.projectName }),
    ...(ctx.buildDir === undefined ? {} : { buildDir: ctx.buildDir }),
    ...(ctx.cwd === undefined ? {} : { cwd: ctx.cwd }),
    ...(ctx.fetchImpl === undefined ? {} : { fetchImpl: ctx.fetchImpl }),
    ...(ctx.netlifyCreateSite === undefined ? {} : { createSite: ctx.netlifyCreateSite }),
  });

/**
 * GitHub Pages create via REST API (public repo + pages from main).
 *
 * @param ctx - Ladder context.
 * @returns Provisioned host or hop-classed error.
 */
const tryGithubPages = (
  ctx: HostLadderStepContext,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  createGithubPagesHost({
    mode: ctx.mode,
    env: ctx.env,
    ...(ctx.projectName === undefined ? {} : { projectName: ctx.projectName }),
    ...(ctx.buildDir === undefined ? {} : { buildDir: ctx.buildDir }),
    ...(ctx.cwd === undefined ? {} : { cwd: ctx.cwd }),
    ...(ctx.fetchImpl === undefined ? {} : { fetchImpl: ctx.fetchImpl }),
    ...(ctx.githubPagesCreate === undefined ? {} : { createPages: ctx.githubPagesCreate }),
  });

/** Default host ladder steps — free static first, then platform hosts. */
export const defaultHostLadderSteps: readonly HostLadderStep[] = [
  { provider: 'cloudflare', tryProvision: tryCloudflare },
  { provider: 'render', tryProvision: tryRender },
  { provider: 'railway', tryProvision: tryRailway },
  { provider: 'vercel', tryProvision: tryVercel },
  { provider: 'netlify', tryProvision: tryNetlify },
  { provider: 'github-pages', tryProvision: tryGithubPages },
];

type FinishArgs = {
  readonly provisioned: ProvisionedHost;
  readonly hopped: boolean;
  readonly fromProvider?: HostLadderProvider;
  readonly skipped: readonly HostLadderProvider[];
  readonly writePin?: (keys: Record<string, string>) => Effect.Effect<void, HostLiveWorkError>;
};

/**
 * Pin + assemble success result.
 *
 * @param args - Winner and hop metadata.
 * @returns Effect of public result.
 */
const finishSuccess = (args: FinishArgs): Effect.Effect<HostLiveWorkResult, HostLiveWorkError> =>
  Effect.gen(function* () {
    const pin = buildHostPinKeys(args.provisioned);
    if (args.writePin) {
      yield* args.writePin(pin);
    }
    const result: {
      provider: HostLadderProvider;
      ephemeral: boolean;
      hopped: boolean;
      skipped: readonly HostLadderProvider[];
      pin: Record<string, string>;
      verified: true;
      buyerMessage: string;
      url?: string;
      projectId?: string;
      fromProvider?: HostLadderProvider;
    } = {
      provider: args.provisioned.provider,
      ephemeral: args.provisioned.ephemeral,
      hopped: args.hopped,
      skipped: args.skipped,
      pin,
      verified: true,
      buyerMessage: buyerHostSuccessMessage(
        args.provisioned.provider,
        args.hopped,
        args.fromProvider,
      ),
    };
    if (args.provisioned.url !== undefined) {
      result.url = args.provisioned.url;
    }
    if (args.provisioned.projectId !== undefined) {
      result.projectId = args.provisioned.projectId;
    }
    if (args.fromProvider !== undefined) {
      result.fromProvider = args.fromProvider;
    }
    return result;
  });

/**
 * Walk the host preference ladder.
 *
 * @param order - Ladder order.
 * @param ctx - Step context.
 * @param steps - Provider steps.
 * @param namedStick - When true, never hop.
 * @param writePin - Optional pin writer.
 * @returns Effect of verified success or ladder failure.
 */
const walkLadder = (
  order: readonly HostLadderProvider[],
  ctx: HostLadderStepContext,
  steps: readonly HostLadderStep[],
  namedStick: boolean,
  writePin: FinishArgs['writePin'],
): Effect.Effect<HostLiveWorkResult, HostLiveWorkError> =>
  Effect.gen(function* () {
    const stepByProvider = new Map(steps.map((step) => [step.provider, step]));
    const skipped: HostLadderProvider[] = [];
    let freeTierFrom: HostLadderProvider | undefined;
    let lastHopClass: string | undefined;

    for (const provider of order) {
      const step = stepByProvider.get(provider);
      if (step === undefined) {
        skipped.push(provider);
      } else {
        const attempt = yield* step.tryProvision(ctx).pipe(Effect.either);
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
        if (namedStick || !shouldContinueHostLadder(error.hopClass)) {
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
      new HostLiveWorkError({
        code: 'ladder_exhausted',
        message: `Host preference ladder exhausted${lastHopClass ? ` (last: ${lastHopClass})` : ''}`,
        hopClass: 'hard_stop',
      }),
    );
  });

/**
 * Run host Live work: preference ladder → provision → verify → pin (ADR-0039).
 * Create adapters are still landing; existing APP_URL + HOSTING_PROVIDER wins.
 *
 * @param options - Mode, env, optional named vendor and pin writer.
 * @returns Effect of verified result with pin keys.
 * @example
 * const result = await Effect.runPromise(
 *   runHostLiveWork({ mode: 'buyer', env: process.env }),
 * );
 */
export const runHostLiveWork = (
  options: RunHostLiveWorkOptions,
): Effect.Effect<HostLiveWorkResult, HostLiveWorkError> =>
  Effect.gen(function* () {
    const env = options.env ?? {};
    const preferExisting = options.preferExisting !== false;

    if (preferExisting && options.namedVendor === undefined) {
      const existing = detectExistingHost(env);
      if (existing !== null) {
        return yield* finishSuccess({
          provisioned: existing,
          hopped: false,
          skipped: [],
          ...(options.writePin === undefined ? {} : { writePin: options.writePin }),
        });
      }
    }

    const ctx: HostLadderStepContext = {
      env,
      mode: options.mode,
      ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
      ...(options.buildDir === undefined ? {} : { buildDir: options.buildDir }),
      ...(options.projectName === undefined ? {} : { projectName: options.projectName }),
      ...(options.wranglerCli === undefined ? {} : { wranglerCli: options.wranglerCli }),
      ...(options.vercelCli === undefined ? {} : { vercelCli: options.vercelCli }),
      ...(options.railwayHostCli === undefined ? {} : { railwayHostCli: options.railwayHostCli }),
      ...(options.renderCreateService === undefined
        ? {}
        : { renderCreateService: options.renderCreateService }),
      ...(options.netlifyCreateSite === undefined
        ? {}
        : { netlifyCreateSite: options.netlifyCreateSite }),
      ...(options.githubPagesCreate === undefined
        ? {}
        : { githubPagesCreate: options.githubPagesCreate }),
      ...(options.fetchImpl === undefined ? {} : { fetchImpl: options.fetchImpl }),
    };

    return yield* walkLadder(
      resolveHostLadderOrder(env, options.namedVendor),
      ctx,
      options.steps ?? defaultHostLadderSteps,
      options.namedVendor !== undefined && options.namedVendor !== null,
      options.writePin,
    );
  });
