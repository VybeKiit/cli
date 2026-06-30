import { handleCheckout, handleWebhook } from '@vybekiit/payments/http';
import { readNodeEnv } from '@/lib/node-env';
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
  const body = await request.json();
  const result = await handleCheckout(body, {
    env,
    appUrl: env.APP_URL,
    requestOrigin: request.headers.get('origin'),
  });
  return NextResponse.json(result.body, { status: result.status });
}
