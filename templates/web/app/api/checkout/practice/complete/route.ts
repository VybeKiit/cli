import { fulfillOrder } from '@/lib/fulfillment';
import { NextResponse } from 'next/server';

/**
 * Complete a practice-mode checkout — simulates provider success + webhook fulfillment
 * when no payment keys are configured. Real purchases use the hosted checkout +
 * `/api/webhook` once the `setup-payments` skill wires a provider.
 *
 * POST body: `{ productId: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
  }

  const orderId = `practice_${productId}_${Date.now()}`;
  const result = await fulfillOrder({
    provider: 'lemon-squeezy',
    eventName: 'practice_checkout_completed',
    orderId,
    customerEmail: 'practice@example.com',
    githubUsername: null,
    isRefund: false,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true, orderId });
}
