import { resolvePaymentProvider } from '@vybekiit/payments';
import { NextResponse } from 'next/server';

/**
 * Start a purchase: create a checkout with the configured payment provider and
 * carry the buyer's GitHub username through as order metadata so the webhook can
 * act on that exact account once payment clears. Provider-agnostic — switching
 * `PAYMENTS_PROVIDER` changes nothing here.
 *
 * POST body: `{ productId: string, githubUsername: string, email?: string }`
 * (`productId` is the provider's purchasable id — see `CheckoutParams`.)
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { productId, githubUsername, email } = await request.json();
  if (!productId || !githubUsername) {
    return NextResponse.json(
      { error: 'productId and githubUsername are required.' },
      { status: 400 },
    );
  }

  const result = await resolvePaymentProvider().createCheckout({
    productId,
    githubUsername,
    email,
    ...(process.env.APP_URL ? { successUrl: process.env.APP_URL } : {}),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }
  return NextResponse.json({ url: result.value.url });
}
