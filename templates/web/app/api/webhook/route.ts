import { fulfillOrder } from '@/lib/fulfillment';
import { lemonSqueezyConfigSchema, parseEnv } from '@vybekiit/core';
import { parseWebhook } from '@vybekiit/pay-lemonsqueezy';
import { NextResponse } from 'next/server';

/**
 * Payment webhook: Lemon Squeezy → fulfillment.
 *
 * Verifies the signature over the exact raw body, then hands the normalized order
 * to {@link fulfillOrder} (which the buyer customizes for their product). Failures
 * return 4xx/5xx so Lemon Squeezy retries appropriately.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  const { LEMONSQUEEZY_WEBHOOK_SECRET } = parseEnv(lemonSqueezyConfigSchema);
  const event = parseWebhook(rawBody, signature, LEMONSQUEEZY_WEBHOOK_SECRET);
  if (!event.ok) {
    return NextResponse.json({ error: event.error.message }, { status: 400 });
  }

  const fulfilled = await fulfillOrder(event.value);
  if (!fulfilled.ok) {
    return NextResponse.json({ error: fulfilled.error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
