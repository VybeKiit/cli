import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { Schema } from 'effect';
import { NextResponse } from 'next/server';
import { ladderJumpTable } from '@/lib/priceLadder';
import {
  applyPaidSaleToLadder,
  getPriceLadderSnapshot,
  resetPriceLadder,
} from '@/lib/priceLadderStore';
import { isPriceLadderTestMode } from '@/lib/priceLadderTestMode';

const BodySchema = Schema.Struct({
  action: Schema.Literal('status', 'simulate-sale', 'reset', 'jumps'),
  orderId: Schema.optional(Schema.String),
  /** How many jump-table rungs to return for `jumps` (default 15). */
  steps: Schema.optional(Schema.Number),
});

/**
 * Test-mode controls for the rising price ladder.
 *
 * Only available when {@link isPriceLadderTestMode} is true (local dev, vitest,
 * `LEMONSQUEEZY_TEST_MODE=true`, or `PRICE_LADDER_TEST_MODE=true`).
 *
 * Actions:
 * - `status` — current snapshot
 * - `simulate-sale` — pretend a paid order cleared (idempotent if `orderId` reused)
 * - `reset` — back to $29 / 0 sales
 * - `jumps` — first N price rungs for manual / e2e verification
 *
 * @param request - JSON body with `action`.
 * @returns Ladder snapshot or jump table, or 404 outside test mode.
 * @example
 * POST /api/dev/price-ladder { "action": "simulate-sale" }
 */
const POST = async (request: Request): Promise<NextResponse> => {
  if (!isPriceLadderTestMode()) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const json = await readRequestJson(request);
  if (!json.ok) {
    return NextResponse.json(json.response.body, { status: json.response.status });
  }

  const parsed = decodeJsonBody(json.body, BodySchema, 'Invalid price-ladder test body.');
  if (!parsed.ok) {
    return NextResponse.json(parsed.response.body, { status: parsed.response.status });
  }

  const { action, orderId, steps } = parsed.body;

  if (action === 'jumps') {
    const table = ladderJumpTable(steps ?? 15);
    return NextResponse.json({ jumps: table });
  }

  if (action === 'reset') {
    const snapshot = await resetPriceLadder();
    return NextResponse.json({ ok: true, action: 'reset', snapshot });
  }

  if (action === 'simulate-sale') {
    const id =
      orderId !== undefined && orderId.trim().length > 0
        ? orderId.trim()
        : `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = await applyPaidSaleToLadder(id);
    return NextResponse.json({
      ok: true,
      action: 'simulate-sale',
      orderId: id,
      bumped: result.bumped,
      paidAmount: result.paidAmount,
      snapshot: result.snapshot,
    });
  }

  const snapshot = await getPriceLadderSnapshot();
  return NextResponse.json({ ok: true, action: 'status', snapshot });
};

/**
 * GET status when test mode is on (handy for curl / e2e without a body).
 *
 * @returns Current ladder snapshot or 404.
 */
const GET = async (): Promise<NextResponse> => {
  if (!isPriceLadderTestMode()) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const snapshot = await getPriceLadderSnapshot();
  return NextResponse.json({ ok: true, action: 'status', snapshot });
};

export { GET, POST };
