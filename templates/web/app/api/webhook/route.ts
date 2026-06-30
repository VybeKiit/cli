import { handleWebhook } from '@vybekiit/payments/http';
import { fulfillOrder } from '@/lib/fulfillment';
import { NextResponse } from 'next/server';

/**
 * Payment webhook: provider → fulfillment.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);
  const result = await handleWebhook(rawBody, headers, { fulfillOrder });
  return NextResponse.json(result.body, { status: result.status });
}
