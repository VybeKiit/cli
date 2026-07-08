import { handleCheckout, CheckoutBodySchema } from '@vybekiit/payments/http';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { readNodeEnv } from '@/lib/nodeEnv';
import { NextResponse } from 'next/server';

/**
 * Start a purchase: create a checkout with the configured payment provider and
 * return the URL to send the buyer to.
 *
 * @param request - Incoming checkout request with a JSON body.
 * @returns The checkout API response as JSON.
 * @example
 * const response = await POST(request);
 */
export const POST = async (request: Request): Promise<NextResponse> => {
  const env = readNodeEnv();
  const requestOrigin = new URL(request.url).origin;
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
    appUrl: env.APP_URL === undefined || env.APP_URL === '' ? requestOrigin : env.APP_URL,
    frontendUrl: `${requestOrigin}/en`,
    requestOrigin,
  });
  return NextResponse.json(result.body, { status: result.status });
};
