import { resolvePaymentProvider } from '@vybekiit/payments';
import { NextResponse } from 'next/server';

/**
 * Start a purchase: create a checkout with the configured payment provider and
 * return the URL to send the buyer to. Provider-agnostic — switching
 * `PAYMENTS_PROVIDER` changes nothing here.
 *
 * Only `productId` (the provider's purchasable id — see `CheckoutParams`) is
 * required: a buyer's pricing page sells the buyer's own product. `githubUsername`
 * and `email` are optional metadata round-tripped to the webhook when present (the
 * kit's own store sets `githubUsername` to gate repo access; most buyer apps omit it).
 * Until the `setup-payments` skill sets the provider's keys, `resolvePaymentProvider`
 * fails loud here with a config error rather than a half-built checkout.
 *
 * POST body: `{ productId: string, githubUsername?: string, email?: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { productId, githubUsername, email } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
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
