import {
  deleteCloudflarePagesProject,
  deleteGithubPagesRepo,
  deleteNetlifySite,
  deleteRenderService,
  deleteVercelProject,
  isHostLadderProvider,
  type LiveWorkMode,
  parseGithubPagesProjectId,
  readGithubToken,
  runHostLiveWork,
  teardownRailwayHost,
  toHostLiveWorkErrorEvent,
  toHostLiveWorkJourneyEvents,
} from '@vybekiit/deploy';
import { Effect, Either } from 'effect';
import { type NextRequest, NextResponse } from 'next/server';
import { loadWorkspaceEnv } from '@/lib/workspaceEnv';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MODES = ['demo', 'dogfood', 'buyer'] as const satisfies readonly LiveWorkMode[];

type Body = {
  readonly mode?: string;
  readonly vendor?: string;
  readonly fresh?: boolean;
};

/**
 * True when value is a Live work mode.
 *
 * @param value - Candidate.
 * @returns Mode guard.
 */
const isMode = (value: string): value is LiveWorkMode =>
  (MODES as readonly string[]).includes(value);

/**
 * Non-empty string from workspace env, or undefined when missing.
 *
 * @param value - Raw env value.
 * @returns Secret string or undefined.
 */
const optionalSecret = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length === 0) {
    return;
  }
  return value;
};

/**
 * Host credential slice only — never pass monorepo HOSTING_PROVIDER/APP_URL so
 * console demos create fresh unless the client opts into preferExisting with
 * explicit pin fields later. Reads monorepo root `.env` for vendor API keys.
 *
 * @returns EnvSource for host Live work create adapters.
 */
const hostCredentialsFromWorkspace = (): Record<string, string | undefined> => {
  const workspace = loadWorkspaceEnv();
  return {
    RENDER_API_KEY: workspace.RENDER_API_KEY,
    RENDER_STATIC_REPO: workspace.RENDER_STATIC_REPO,
    VERCEL_TOKEN: workspace.VERCEL_TOKEN,
    CLOUDFLARE_API_TOKEN: workspace.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: workspace.CLOUDFLARE_ACCOUNT_ID,
    NETLIFY_AUTH_TOKEN: workspace.NETLIFY_AUTH_TOKEN,
    GITHUB_TOKEN: workspace.GITHUB_TOKEN,
    GH_TOKEN: workspace.GH_TOKEN,
    GITHUB_PAGES_OWNER: workspace.GITHUB_PAGES_OWNER,
  };
};

/**
 * Best-effort mode-scoped teardown for ephemeral host creates.
 *
 * @param result - Live work success snapshot.
 * @returns Whether teardown ran without throwing.
 */
const teardownEphemeralHost = async (result: {
  readonly ephemeral: boolean;
  readonly provider: string;
  readonly projectId?: string;
}): Promise<boolean> => {
  if (!result.ephemeral || typeof result.projectId !== 'string' || result.projectId.length === 0) {
    return false;
  }
  if (result.provider === 'cloudflare') {
    await Effect.runPromise(deleteCloudflarePagesProject(result.projectId));
    return true;
  }
  if (result.provider === 'vercel') {
    const workspace = loadWorkspaceEnv();
    const token = optionalSecret(workspace.VERCEL_TOKEN);
    await Effect.runPromise(deleteVercelProject(result.projectId, undefined, token));
    return true;
  }
  if (result.provider === 'render') {
    const workspace = loadWorkspaceEnv();
    const apiKey = optionalSecret(workspace.RENDER_API_KEY);
    if (apiKey === undefined) {
      return false;
    }
    await Effect.runPromise(deleteRenderService(result.projectId, apiKey));
    return true;
  }
  if (result.provider === 'railway') {
    await Effect.runPromise(teardownRailwayHost());
    return true;
  }
  if (result.provider === 'netlify') {
    const workspace = loadWorkspaceEnv();
    const token = optionalSecret(workspace.NETLIFY_AUTH_TOKEN);
    if (token === undefined) {
      return false;
    }
    await Effect.runPromise(deleteNetlifySite(result.projectId, token));
    return true;
  }
  if (result.provider === 'github-pages') {
    const workspace = loadWorkspaceEnv();
    const token = readGithubToken(workspace);
    const parsed = parseGithubPagesProjectId(result.projectId);
    if (token === null || parsed === null) {
      return false;
    }
    await Effect.runPromise(deleteGithubPagesRepo(parsed.owner, parsed.repo, token));
    return true;
  }
  return false;
};

/**
 * POST /api/live-work/host — real host Live work for the local-dev console (ADR-0039).
 * Returns public JSON + journey tool events only. Never pins monorepo `.env` and never
 * returns API tokens. Demo/dogfood ephemeral projects are best-effort deleted after
 * verify (mode-scoped teardown for Cloudflare / Render / Railway / Vercel).
 *
 * @param request - JSON body: mode, vendor, fresh.
 * @returns Public success or failure payload.
 */
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const modeRaw = typeof body.mode === 'string' && body.mode.length > 0 ? body.mode : 'demo';
  if (!isMode(modeRaw)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'invalid_args',
        message: `Unknown mode "${modeRaw}". Use demo, dogfood, or buyer.`,
        events: [toHostLiveWorkErrorEvent('invalid_args', 'Bad mode')],
      },
      { status: 400 },
    );
  }

  const vendorRaw = typeof body.vendor === 'string' ? body.vendor : undefined;
  if (vendorRaw !== undefined && vendorRaw !== '' && !isHostLadderProvider(vendorRaw)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'invalid_args',
        message: `Unknown vendor "${vendorRaw}". Use cloudflare, render, railway, or vercel.`,
        events: [toHostLiveWorkErrorEvent('invalid_args', 'Bad vendor')],
      },
      { status: 400 },
    );
  }

  const preferExisting = body.fresh !== true;

  const either = await Effect.runPromise(
    Effect.either(
      runHostLiveWork({
        mode: modeRaw,
        env: hostCredentialsFromWorkspace(),
        preferExisting,
        ...(vendorRaw !== undefined && isHostLadderProvider(vendorRaw)
          ? { namedVendor: vendorRaw }
          : {}),
      }),
    ),
  );

  if (Either.isLeft(either)) {
    const error = either.left;
    return NextResponse.json(
      {
        ok: false,
        code: error.code,
        message: error.message,
        hopClass: error.hopClass,
        ...(error.provider === undefined ? {} : { provider: error.provider }),
        events: [toHostLiveWorkErrorEvent(error.code, error.message)],
      },
      { status: 422 },
    );
  }

  const result = either.right;
  const tornDown = await teardownEphemeralHost(result);

  const publicPayload = {
    ok: true as const,
    provider: result.provider,
    ephemeral: result.ephemeral,
    hopped: result.hopped,
    skipped: result.skipped,
    verified: true as const,
    buyerMessage: result.buyerMessage,
    pinKeys: Object.keys(result.pin),
    pinned: false,
    tornDown,
    events: toHostLiveWorkJourneyEvents(result),
    ...(result.fromProvider === undefined ? {} : { fromProvider: result.fromProvider }),
    ...(typeof result.url === 'string' ? { url: result.url } : {}),
  };

  const json = JSON.stringify(publicPayload);
  // Guard obvious secret shapes — never return API tokens or private keys.
  if (
    json.includes('Bearer ') ||
    /"VERCEL_TOKEN"\s*:/.test(json) ||
    /"RENDER_API_KEY"\s*:/.test(json) ||
    /"CLOUDFLARE_API_TOKEN"\s*:/.test(json)
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: 'secret_leak_guard',
        message: 'Refused to return a payload that looked like a secret token.',
        events: [toHostLiveWorkErrorEvent('secret_leak_guard', 'blocked')],
      },
      { status: 500 },
    );
  }

  return NextResponse.json(publicPayload);
};
