import { fulfillOrder } from '@/lib/fulfillment';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { NextResponse } from 'next/server';

/**
 * Payment webhook: provider → fulfillment.
 *
 * Verifies the signature over the exact raw body (the provider knows which header
 * holds it), then hands the normalized order to {@link fulfillOrder} (which the
 * buyer customizes for their product). Failures return 4xx/5xx so the provider
 * retries appropriately.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  const event = await resolvePaymentProvider().parseWebhook(rawBody, headers);
  if (!event.ok) {
    return NextResponse.json({ error: event.error.message }, { status: 400 });
  }

  const fulfilled = await fulfillOrder(event.value);
  if (!fulfilled.ok) {
    return NextResponse.json({ error: fulfilled.error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
