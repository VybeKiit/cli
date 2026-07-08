import { type AppConfig, appConfigSchema, parseEnv, storeConfigSchema } from '@vybekiit/core';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { Effect, Either, Schema } from 'effect';
import { NextResponse } from 'next/server';
import { isValidEmail, isValidGithubUsername } from '@/lib/validation';

const LandingCheckoutBodySchema = Schema.Struct({
  githubUsername: Schema.String,
  email: Schema.String,
});

/**
 * Start a purchase of VybeKiit itself.
 *
 * Reads what is being sold from env (`STORE_PRODUCT_ID` — the provider's purchasable
 * id), carries the buyer's GitHub username through as order metadata so the gate
 * webhook can invite that exact account once payment clears, and returns the hosted
 * checkout `{ url }` for the client to redirect to. Provider-agnostic via
 * {@link resolvePaymentProvider} — Lemon Squeezy is the default Merchant of Record.
 *
 * POST body: `{ githubUsername: string, email: string }`.
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
  const parsed = decodeJsonBody(
    json.body,
    LandingCheckoutBodySchema,
    'Enter your GitHub username and email.',
  );
  if (!parsed.ok) {
    return NextResponse.json(parsed.response.body, { status: parsed.response.status });
  }
  const { githubUsername, email } = parsed.body;

  if (!isValidGithubUsername(githubUsername)) {
    return NextResponse.json({ error: 'Enter a valid GitHub username.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  let productId: string;
  let app: AppConfig;
  try {
    productId = parseEnv(storeConfigSchema).STORE_PRODUCT_ID;
    app = parseEnv(appConfigSchema);
  } catch {
    return NextResponse.json({ error: 'Checkout is not available right now.' }, { status: 500 });
  }

  const checkout = await Effect.runPromise(
    Effect.either(
      resolvePaymentProvider().createCheckout({
        productId,
        githubUsername,
        email,
        successUrl: `${app.APP_URL}/success`,
        cancelUrl: `${app.APP_URL}/cancel`,
      }),
    ),
  );

  if (Either.isLeft(checkout)) {
    return NextResponse.json({ error: checkout.left.message }, { status: 502 });
  }
  return NextResponse.json({ url: checkout.right.url });
};

export { POST };
