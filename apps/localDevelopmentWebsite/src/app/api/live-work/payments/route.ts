import {
  isPaymentsLadderProvider,
  type LiveWorkMode,
  runPaymentsLiveWork,
  toPaymentsLiveWorkErrorEvent,
  toPaymentsLiveWorkJourneyEvents,
} from '@vybekiit/payments';
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
 * Payment-related env keys only (never pass the full monorepo `.env` blob into
 * public error paths). Values stay server-side for credential verify.
 * Reads monorepo root `.env` when the console process did not inherit keys.
 *
 * @returns EnvSource slice for payments Live work.
 */
const paymentsEnvFromWorkspace = (): Record<string, string | undefined> => {
  const workspace = loadWorkspaceEnv();
  const keys = [
    'PAYMENTS_PROVIDER',
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET',
    'LEMONSQUEEZY_TEST_MODE',
    'LEMONSQUEEZY_TEST_MODE_API_KEY',
    'LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_ID',
    'PAYPAL_ENV',
  ] as const;
  const out: Record<string, string | undefined> = {};
  for (const key of keys) {
    out[key] = workspace[key];
  }
  return out;
};

/**
 * POST /api/live-work/payments — real payments Live work for the local-dev console (ADR-0039).
 * Returns public JSON + journey tool events only. Never pins monorepo `.env` and never
 * returns API secrets (pinKeys is `PAYMENTS_PROVIDER` only).
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
        events: [toPaymentsLiveWorkErrorEvent('invalid_args', 'Bad mode')],
      },
      { status: 400 },
    );
  }

  const vendorRaw = typeof body.vendor === 'string' ? body.vendor : undefined;
  if (vendorRaw !== undefined && vendorRaw !== '' && !isPaymentsLadderProvider(vendorRaw)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'invalid_args',
        message: `Unknown vendor "${vendorRaw}". Use lemon-squeezy, stripe, or paypal.`,
        events: [toPaymentsLiveWorkErrorEvent('invalid_args', 'Bad vendor')],
      },
      { status: 400 },
    );
  }

  const preferExisting = body.fresh !== true;

  const either = await Effect.runPromise(
    Effect.either(
      runPaymentsLiveWork({
        mode: modeRaw,
        env: paymentsEnvFromWorkspace(),
        preferExisting,
        ...(vendorRaw !== undefined && isPaymentsLadderProvider(vendorRaw)
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
        events: [toPaymentsLiveWorkErrorEvent(error.code, error.message)],
      },
      { status: 422 },
    );
  }

  const result = either.right;
  const publicPayload = {
    ok: true as const,
    provider: result.provider,
    ephemeral: false as const,
    hopped: result.hopped,
    skipped: result.skipped,
    verified: true as const,
    buyerMessage: result.buyerMessage,
    pinKeys: Object.keys(result.pin),
    pinned: false,
    events: toPaymentsLiveWorkJourneyEvents(result),
    ...(result.fromProvider === undefined ? {} : { fromProvider: result.fromProvider }),
  };

  const json = JSON.stringify(publicPayload);
  // Guard obvious secret shapes — never return API tokens or private keys.
  if (
    json.includes('sk_') ||
    json.includes('whsec_') ||
    json.includes('Bearer ') ||
    /"STRIPE_SECRET_KEY"\s*:/.test(json) ||
    /"LEMONSQUEEZY_API_KEY"\s*:/.test(json) ||
    /"PAYPAL_CLIENT_SECRET"\s*:/.test(json)
  ) {
    return NextResponse.json(
      {
        ok: false,
        code: 'secret_leak_guard',
        message: 'Refused to return a payload that looked like a payment secret.',
        events: [toPaymentsLiveWorkErrorEvent('secret_leak_guard', 'blocked')],
      },
      { status: 500 },
    );
  }

  return NextResponse.json(publicPayload);
};
