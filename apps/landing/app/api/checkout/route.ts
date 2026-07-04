import { type AppConfig, appConfigSchema, parseEnv, storeConfigSchema } from '@vybekiit/core';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { Cause, Effect, Exit, Option, Schema } from 'effect';
import { NextResponse } from 'next/server';

const LandingCheckoutBodySchema = Schema.Struct({
  githubUsername: Schema.String,
  email: Schema.String,
});

function isValidGithubUsername(value: string): boolean {
  // GitHub username rules — e.g. `octo-cat` ok, `-bad` rejected (must start/end alphanumeric)
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value);
}

function isValidEmail(value: string): boolean {
  // Simple email shape — e.g. `you@example.com`; not full RFC validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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
 */
export async function POST(request: Request): Promise<NextResponse> {
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

  const exit = await Effect.runPromiseExit(
    resolvePaymentProvider().createCheckout({
      productId,
      githubUsername,
      email,
      successUrl: `${app.APP_URL}/success`,
      cancelUrl: `${app.APP_URL}/cancel`,
    }),
  );

  if (Exit.isFailure(exit)) {
    const message =
      Option.getOrNull(Cause.failureOption(exit.cause))?.message ?? 'Checkout failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
  return NextResponse.json({ url: exit.value.url });
}
