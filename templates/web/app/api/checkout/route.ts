import { isPaymentsUnconfigured } from '@/lib/payments-practice';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { NextResponse } from 'next/server';
/**
 * Start a purchase: create a checkout with the configured payment provider and
 * return the URL to send the buyer to. Provider-agnostic — switching
 * `PAYMENTS_PROVIDER` changes nothing here.
 *
 * When no provider keys are set, returns a practice checkout URL on this app so
 * the pricing flow is end-to-end in session #1 (real hosted checkout waits on
 * the `setup-payments` skill).
 *
 * POST body: `{ productId: string, githubUsername?: string, email?: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { productId, githubUsername, email } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
  }

  if (isPaymentsUnconfigured()) {
    const base = process.env.APP_URL ?? request.headers.get('origin') ?? 'http://localhost:3000';
    const url = `${base}/checkout/practice?productId=${encodeURIComponent(productId)}`;
    return NextResponse.json({ url });
  }

  const result = await resolvePaymentProvider().createCheckout({
    productId,
    ...(githubUsername ? { githubUsername } : {}),
    ...(email ? { email } : {}),
    ...(process.env.APP_URL ? { successUrl: process.env.APP_URL } : {}),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }
  return NextResponse.json({ url: result.value.url });
}
