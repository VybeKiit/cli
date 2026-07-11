import { type AppConfig, appConfigSchema, parseEnv, storeConfigSchema } from '@vybekiit/core';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { resolvePaymentProvider, resolveStoreProductId } from '@vybekiit/payments';
import { Effect, Either } from 'effect';
import { NextResponse } from 'next/server';
import { AnalyticsEvent } from '@/lib/analyticsEvents';
import { captureServerEvent } from '@/lib/analyticsServer';
import { getPriceLadderSnapshot } from '@/lib/priceLadderStore';
import { LandingCheckoutBodySchema } from '@/lib/validation';

/**
 * Start a purchase of VybeKiit itself.
 *
 * Reads what is being sold from env (`STORE_PRODUCT_ID` — the provider's purchasable
 * id), carries the buyer's GitHub username through as order metadata so the gate
 * webhook can invite that exact account once payment clears, and returns the hosted
 * checkout `{ url }` for the client to redirect to. Provider-agnostic via
 * {@link resolvePaymentProvider} — Lemon Squeezy is the default Merchant of Record.
 *
 * POST body: `{ githubUsername: string, email: string }` (Effect Schema validated).
 *
 * @param request - Incoming checkout request.
 * @returns JSON response with a hosted checkout URL or an error.
 * @example
 * const response = await POST(request);
 */
const POST = async (request: Request): Promise<NextResponse> => {
  const json = await readRequestJson(request);
  if (!json.ok) {
    return NextResponse.json(json.response.body, { status: json.response.status });
  }

  // Shape + domain rules (GitHub username, email) live in LandingCheckoutBodySchema.
  const parsed = decodeJsonBody(
    json.body,
    LandingCheckoutBodySchema,
    'Enter your GitHub username and email.',
  );
  if (!parsed.ok) {
    return NextResponse.json(parsed.response.body, { status: parsed.response.status });
  }
  const { githubUsername, email } = parsed.body;
  const distinctId = email.trim().toLowerCase();

  let productId: string;
  let app: AppConfig;
  try {
    // Prefer LEMONSQUEEZY_TEST_MODE_STORE_PRODUCT_ID when test-mode keys are active so
    // production STORE_PRODUCT_ID stays the live variant.
    productId = resolveStoreProductId() ?? parseEnv(storeConfigSchema).STORE_PRODUCT_ID;
    app = parseEnv(appConfigSchema);
  } catch {
    await captureServerEvent(distinctId, AnalyticsEvent.checkoutSessionFailed, {
      error: 'config_unavailable',
      source: 'server',
    });
    return NextResponse.json({ error: 'Checkout is not available right now.' }, { status: 500 });
  }

  // Lock the live ladder price onto this checkout (LS custom_price) so the buyer
  // pays the rung they saw — concurrent sales do not change an open session.
  const ladder = await getPriceLadderSnapshot();

  const checkout = await Effect.runPromise(
    Effect.either(
      resolvePaymentProvider().createCheckout({
        productId,
        githubUsername,
        email,
        successUrl: `${app.APP_URL}/success`,
        cancelUrl: `${app.APP_URL}/cancel`,
        customPriceCents: ladder.amountCents,
      }),
    ),
  );

  if (Either.isLeft(checkout)) {
    await captureServerEvent(distinctId, AnalyticsEvent.checkoutSessionFailed, {
      error: checkout.left.message,
      source: 'server',
      product_id: productId,
    });
    return NextResponse.json({ error: checkout.left.message }, { status: 502 });
  }

  await captureServerEvent(distinctId, AnalyticsEvent.checkoutSessionCreated, {
    source: 'server',
    product_id: productId,
    github_username: githubUsername.trim(),
    price_usd: ladder.amount,
    sale_count: ladder.saleCount,
  });

  return NextResponse.json({
    url: checkout.right.url,
    priceUsd: ladder.amount,
    priceDisplay: ladder.display,
  });
};

export { POST };
