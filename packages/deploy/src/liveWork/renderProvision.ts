import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { EnvSource } from '@vybekiit/core';
import { Effect } from 'effect';
import {
  defaultLiveWorkProjectName,
  verifyHostUrl,
  writeDemoStaticSite,
} from './cloudflareProvision';
import {
  HostLiveWorkError,
  type LiveWorkMode,
  makeProvisionedHost,
  type ProvisionedHost,
} from './types';

/**
 * Options for {@link createRenderHost}.
 */
export type CreateRenderHostOptions = {
  readonly mode: LiveWorkMode;
  readonly projectName?: string;
  readonly buildDir?: string;
  readonly cwd?: string;
  readonly env?: EnvSource;
  /** Injectable fetch (Render REST API + ready-check). */
  readonly fetchImpl?: typeof fetch;
  readonly skipVerify?: boolean;
  /**
   * When set, skip live API and use this result (tests). Prefer unit tests inject
   * `createService` instead when simulating HTTP.
   */
  readonly createService?: (input: RenderCreateServiceInput) => Promise<RenderCreateServiceResult>;
};

/**
 * Input to Render static-site create (test seam).
 */
export type RenderCreateServiceInput = {
  readonly name: string;
  readonly apiKey: string;
};

/**
 * Result from Render create (test seam).
 */
export type RenderCreateServiceResult = {
  readonly serviceId: string;
  readonly url: string;
};

/**
 * Read Render API key from env (never log the value).
 *
 * @param env - Raw environment.
 * @returns Key or null.
 */
export const readRenderApiKey = (env: EnvSource): string | null => {
  const value = env.RENDER_API_KEY;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value;
};

/**
 * Resolve the workspace `ownerId` required by Render create-service.
 * Prefer `RENDER_OWNER_ID` when set; otherwise GET `/v1/owners` and take the first id.
 *
 * @param apiKey - Render API key (never log).
 * @param env - Optional env for `RENDER_OWNER_ID` pin.
 * @param fetchImpl - Injectable fetch.
 * @returns Owner/workspace id (`tea-…` / `usr-…`).
 * @example
 * const ownerId = await resolveRenderOwnerId(apiKey, env);
 */
export const resolveRenderOwnerId = async (
  apiKey: string,
  env: EnvSource = {},
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<string> => {
  const pinned = env.RENDER_OWNER_ID;
  if (typeof pinned === 'string' && pinned.length > 0) {
    return pinned;
  }

  const response = await fetchImpl('https://api.render.com/v1/owners', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw Object.assign(new Error(text || `Render owners HTTP ${response.status}`), {
      hopClass:
        response.status === 401 || response.status === 403 ? 'missing_credentials' : 'hard_stop',
      code: 'render_owners_failed',
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw Object.assign(new Error('Render owners response was not JSON'), {
      hopClass: 'hard_stop' as const,
      code: 'render_owners_invalid',
    });
  }

  const rows = Array.isArray(parsed) ? parsed : [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) {
      continue;
    }
    const owner = (row as { owner?: unknown }).owner;
    if (typeof owner !== 'object' || owner === null) {
      continue;
    }
    const id = (owner as { id?: unknown }).id;
    if (typeof id === 'string' && id.length > 0) {
      return id;
    }
  }

  throw Object.assign(new Error('Render account has no workspace owner id'), {
    hopClass: 'onboarding_blocked' as const,
    code: 'render_no_owner',
  });
};

/**
 * Best-effort delete a Render service (demo/dogfood teardown).
 *
 * @param serviceId - Render service id.
 * @param apiKey - Render API key (never log).
 * @param fetchImpl - Injectable fetch.
 * @returns Always-succeeding Effect.
 * @example
 * await Effect.runPromise(deleteRenderService('srv-…', apiKey));
 */
export const deleteRenderService = (
  serviceId: string,
  apiKey: string,
  fetchImpl: typeof fetch = globalThis.fetch,
): Effect.Effect<void, never> =>
  Effect.promise(async () => {
    try {
      await fetchImpl(`https://api.render.com/v1/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });
    } catch {
      // best-effort teardown
    }
  });

/**
 * Create a Render static site via REST API (ADR-0039 host ladder #2).
 * Missing RENDER_API_KEY → missing_credentials hop.
 *
 * Note: Render static sites usually need a public git repo. When the API cannot
 * create without a repo URL, this returns onboarding_blocked so the ladder can hop.
 * Injectable `createService` covers unit tests without network.
 *
 * @param options - Mode, env, optional createService seam.
 * @returns Effect of provisioned host with public URL.
 * @example
 * await Effect.runPromise(createRenderHost({ mode: 'demo', env: { RENDER_API_KEY: '…' } }));
 */
export const createRenderHost = (
  options: CreateRenderHostOptions,
): Effect.Effect<ProvisionedHost, HostLiveWorkError> =>
  Effect.gen(function* () {
    const env = options.env ?? {};
    const apiKey = readRenderApiKey(env);
    if (apiKey === null && options.createService === undefined) {
      return yield* Effect.fail(
        new HostLiveWorkError({
          code: 'render_missing_api_key',
          message: 'Render host create needs RENDER_API_KEY (or connect tools)',
          hopClass: 'missing_credentials',
          provider: 'render',
        }),
      );
    }

    const projectName = options.projectName ?? defaultLiveWorkProjectName('vybekiit-lw-rd');
    const ephemeral = options.mode === 'demo' || options.mode === 'dogfood';
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;

    // Ensure demo site exists when buyer didn't pass buildDir (parity with other hosts).
    if (
      (options.buildDir === undefined || options.buildDir.length === 0) &&
      options.mode === 'buyer' &&
      options.createService === undefined
    ) {
      return yield* Effect.fail(
        new HostLiveWorkError({
          code: 'missing_build_dir',
          message: 'Buyer host create needs a build directory (static assets to publish)',
          hopClass: 'missing_credentials',
          provider: 'render',
        }),
      );
    }
    if (
      options.mode !== 'buyer' &&
      (options.buildDir === undefined || options.buildDir.length === 0)
    ) {
      const parent =
        options.cwd ?? join(tmpdir(), defaultLiveWorkProjectName('vybekiit-lw-rd-site'));
      mkdirSync(parent, { recursive: true });
      writeDemoStaticSite(parent);
    }

    const provisioned = yield* Effect.tryPromise({
      try: async () => {
        if (options.createService !== undefined) {
          const created = await options.createService({
            name: projectName,
            apiKey: apiKey ?? 'test-key',
          });
          return makeProvisionedHost(
            { provider: 'render', ephemeral },
            { url: created.url, projectId: created.serviceId },
          );
        }

        // Live path: attempt static site create. Render often requires a repo —
        // classify that as onboarding_blocked so the ladder hops free-tier style.
        const repo = typeof env.RENDER_STATIC_REPO === 'string' ? env.RENDER_STATIC_REPO : null;
        if (repo === null || repo.length === 0) {
          throw Object.assign(
            new Error(
              'Render static host needs a public git repo (set RENDER_STATIC_REPO) or use another host',
            ),
            {
              hopClass: 'onboarding_blocked' as const,
              code: 'render_needs_repo',
            },
          );
        }

        // Render requires ownerId (workspace). Prefer pin; else list owners.
        const ownerId = await resolveRenderOwnerId(apiKey ?? '', env, fetchImpl);

        const response = await fetchImpl('https://api.render.com/v1/services', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            type: 'static_site',
            name: projectName,
            ownerId,
            repo,
            branch: 'main',
            autoDeploy: 'yes',
            // Root index.html dogfood repos (not ./public)
            serviceDetails: {
              publishPath: '.',
            },
          }),
        });

        const text = await response.text();
        if (response.status === 401 || response.status === 403) {
          throw Object.assign(new Error(text || 'Render unauthorized'), {
            hopClass: 'missing_credentials' as const,
            code: 'render_unauthorized',
          });
        }
        // Only classify hop signals on error responses — success JSON includes
        // fields like "buildPlan" that would false-positive /plan/i.
        if (!response.ok) {
          const lower = text.toLowerCase();
          if (
            response.status === 429 ||
            response.status === 402 ||
            lower.includes('quota') ||
            lower.includes('rate limit') ||
            lower.includes('payment required') ||
            lower.includes('free plan') ||
            lower.includes('upgrade your plan')
          ) {
            throw Object.assign(new Error(text || 'Render quota'), {
              hopClass: 'quota' as const,
              code: 'render_quota',
            });
          }
          throw Object.assign(new Error(text || `Render create HTTP ${response.status}`), {
            hopClass: 'hard_stop' as const,
            code: 'render_create_failed',
          });
        }

        let serviceId = projectName;
        let url = `https://${projectName}.onrender.com`;
        try {
          const parsed = JSON.parse(text) as {
            service?: { id?: string; serviceDetails?: { url?: string } };
            id?: string;
            serviceDetails?: { url?: string };
          };
          const id = parsed.service?.id ?? parsed.id;
          if (typeof id === 'string' && id.length > 0) {
            serviceId = id;
          }
          const serviceUrl = parsed.service?.serviceDetails?.url ?? parsed.serviceDetails?.url;
          if (typeof serviceUrl === 'string' && serviceUrl.startsWith('http')) {
            url = serviceUrl;
          }
        } catch {
          // keep defaults from project name
        }

        return makeProvisionedHost(
          { provider: 'render', ephemeral },
          { url, projectId: serviceId },
        );
      },
      catch: (cause) => mapRenderCause(cause),
    });

    if (options.skipVerify !== true && typeof provisioned.url === 'string') {
      // First Render static deploy often needs 1–3 minutes (git clone + CDN).
      yield* verifyHostUrl(provisioned.url, fetchImpl, {
        attempts: 36,
        delayMs: 5000,
      }).pipe(
        Effect.mapError(
          (error) =>
            new HostLiveWorkError({
              code: error.code,
              message: error.message,
              hopClass: error.hopClass,
              provider: 'render',
            }),
        ),
      );
    }

    return provisioned;
  });

/**
 * Map thrown values into {@link HostLiveWorkError}.
 *
 * @param cause - Unknown failure.
 * @returns Host Live work error.
 */
const mapRenderCause = (cause: unknown): HostLiveWorkError => {
  if (cause instanceof HostLiveWorkError) {
    return cause;
  }
  const message = cause instanceof Error ? cause.message : 'Render host provision failed';
  const hopClass =
    typeof cause === 'object' &&
    cause !== null &&
    'hopClass' in cause &&
    typeof (cause as { hopClass: unknown }).hopClass === 'string'
      ? ((cause as { hopClass: string }).hopClass as HostLiveWorkError['hopClass'])
      : 'hard_stop';
  const code =
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    typeof (cause as { code: unknown }).code === 'string'
      ? (cause as { code: string }).code
      : 'render_provision_failed';

  const safeHop: HostLiveWorkError['hopClass'] =
    hopClass === 'quota' ||
    hopClass === 'onboarding_blocked' ||
    hopClass === 'missing_credentials' ||
    hopClass === 'hard_stop'
      ? hopClass
      : 'hard_stop';

  return new HostLiveWorkError({
    code,
    message,
    hopClass: safeHop,
    provider: 'render',
  });
};
