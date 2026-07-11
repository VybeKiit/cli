import { NextResponse } from 'next/server';
import { PRICE_LADDER } from '@/lib/priceLadder';
import { getPriceLadderSnapshot } from '@/lib/priceLadderStore';

/**
 * Public live pricing for the store UI and e2e checks.
 *
 * @returns JSON {@link PriceLadderSnapshot} plus ladder knobs.
 * @example
 * GET /api/pricing → { amount: 29, display: "$29", nextAmount: 32, … }
 */
const GET = async (): Promise<NextResponse> => {
  const snapshot = await getPriceLadderSnapshot();
  return NextResponse.json(
    {
      ...snapshot,
      ladder: {
        startUsd: PRICE_LADDER.startUsd,
        ceilingUsd: PRICE_LADDER.ceilingUsd,
        multiplier: PRICE_LADDER.multiplier,
      },
    },
    {
      headers: {
        // Short cache so CTAs stay fresh after a sale without hammering D1.
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    },
  );
};

export { GET };
