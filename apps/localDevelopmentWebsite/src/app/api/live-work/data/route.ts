import {
  isDataLadderProvider,
  type LiveWorkMode,
  runDataLiveWork,
  toDataLiveWorkErrorEvent,
  toDataLiveWorkJourneyEvents,
} from '@vybekiit/db';
import { Effect, Either } from 'effect';
import { type NextRequest, NextResponse } from 'next/server';

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
 * POST /api/live-work/data — real data Live work for the local-dev console (ADR-0039).
 * Returns public JSON + journey tool events only. Never pins monorepo `.env` and never
 * returns connection secrets (demo/dogfood claimable lives for the request verify only).
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
        events: [toDataLiveWorkErrorEvent('invalid_args', 'Bad mode')],
      },
      { status: 400 },
    );
  }

  const vendorRaw = typeof body.vendor === 'string' ? body.vendor : undefined;
  if (vendorRaw !== undefined && vendorRaw !== '' && !isDataLadderProvider(vendorRaw)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'invalid_args',
        message: `Unknown vendor "${vendorRaw}". Use supabase, neon, or railway.`,
        events: [toDataLiveWorkErrorEvent('invalid_args', 'Bad vendor')],
      },
      { status: 400 },
    );
  }

  const preferExisting = body.fresh !== true;

  const either = await Effect.runPromise(
    Effect.either(
      runDataLiveWork({
        mode: modeRaw,
        env: {},
        preferExisting,
        ref: 'vybekiit-console-live-work',
        ...(vendorRaw !== undefined && isDataLadderProvider(vendorRaw)
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
        events: [toDataLiveWorkErrorEvent(error.code, error.message)],
      },
      { status: 422 },
    );
  }

  const result = either.right;
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
    events: toDataLiveWorkJourneyEvents(result),
    ...(result.fromProvider === undefined ? {} : { fromProvider: result.fromProvider }),
    ...(typeof result.claimUrl === 'string' ? { claimUrl: result.claimUrl } : {}),
    ...(typeof result.claimableId === 'string' ? { claimableId: result.claimableId } : {}),
  };

  const json = JSON.stringify(publicPayload);
  if (json.includes('postgresql://') || json.includes('postgres://')) {
    return NextResponse.json(
      {
        ok: false,
        code: 'secret_leak_guard',
        message: 'Refused to return a payload that looked like a connection string.',
        events: [toDataLiveWorkErrorEvent('secret_leak_guard', 'blocked')],
      },
      { status: 500 },
    );
  }

  return NextResponse.json(publicPayload);
};
