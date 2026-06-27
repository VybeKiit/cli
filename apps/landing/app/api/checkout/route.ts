import { isValidEmail, isValidGithubUsername } from '@/lib/validation';
import { type AppConfig, appConfigSchema, parseEnv, storeConfigSchema } from '@vybekiit/core';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { NextResponse } from 'next/server';

/**
 * Start a purchase of VybeKiit itself.
 *
 * Reads what is being sold from env (`STORE_PRODUCT_ID` — the provider's purchasable
 * id), carries the buyer's GitHub username through as order metadata so the gate
 * webhook can invite that exact account once payment clears, and returns the hosted
 * checkout `{ url }` for the client to redirect to. Provider-agnostic via
 * {@link resolvePaymentProvider} — Lemon Squeezy is the default Merchant of Record.
 *
 * TODO(vybekiit): live checkout needs the store's real Lemon Squeezy keys
 * (LEMONSQUEEZY_API_KEY / _STORE_ID) plus STORE_PRODUCT_ID set to the kit's variant
 * id — tracked under issue #4 (live wiring). Without them `resolvePaymentProvider()`
 * throws on the missing config and this route returns a clean 500. — skill: setup-payments
 *
 * POST body: `{ githubUsername: string, email: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { githubUsername, email } = await readBody(request);

  if (!isValidGithubUsername(githubUsername)) {
    return NextResponse.json({ error: 'Enter a valid GitHub username.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // parseEnv throws if the store's product id / provider keys are missing; a
  // misconfigured store fails loud here rather than creating an empty cart.
  let productId: string;
  let app: AppConfig;
  try {
    productId = parseEnv(storeConfigSchema).STORE_PRODUCT_ID;
    app = parseEnv(appConfigSchema);
  } catch {
    // Do not echo the validation detail to the client — it can name env keys.
    return NextResponse.json({ error: 'Checkout is not available right now.' }, { status: 500 });
  }

  const result = await resolvePaymentProvider().createCheckout({
    productId,
    githubUsername,
    email,
    successUrl: `${app.APP_URL}/success`,
    cancelUrl: `${app.APP_URL}/cancel`,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }
  return NextResponse.json({ url: result.value.url });
}

/** The fields the checkout form posts. Strings default to empty so absent keys validate as invalid. */
interface CheckoutBody {
  readonly githubUsername: string;
  readonly email: string;
}

/** Read + coerce the request body to {@link CheckoutBody}, tolerating a malformed/empty body. */
async function readBody(request: Request): Promise<CheckoutBody> {
  try {
    const raw: unknown = await request.json();
    const body = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
    return {
      githubUsername: typeof body.githubUsername === 'string' ? body.githubUsername : '',
      email: typeof body.email === 'string' ? body.email : '',
    };
  } catch {
    return { githubUsername: '', email: '' };
  }
}
