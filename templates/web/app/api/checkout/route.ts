import { handleCheckout, CheckoutBodySchema } from '@vybekiit/payments/http';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { readNodeEnv } from '@/lib/nodeEnv';
import { fulfillOrder } from '@/lib/fulfillment';
import { NextResponse } from 'next/server';

/**
 * Start a purchase: create a checkout with the configured payment provider and
 * return the URL to send the buyer to.
 *
 * POST body: `{ productId: string, githubUsername?: string, email?: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const env = readNodeEnv();
  const json = await readRequestJson(request);
  if (!json.ok) {
    return NextResponse.json(json.response.body, { status: json.response.status });
  }
  const parsed = decodeJsonBody(json.body, CheckoutBodySchema, 'productId is required.');
  if (!parsed.ok) {
    return NextResponse.json(parsed.response.body, { status: parsed.response.status });
  }
  const result = await handleCheckout(parsed.body, {
    env,
    appUrl: env.APP_URL,
    frontendUrl: env.APP_URL,
    requestOrigin: request.headers.get('origin'),
  });
  return NextResponse.json(result.body, { status: result.status });
}
