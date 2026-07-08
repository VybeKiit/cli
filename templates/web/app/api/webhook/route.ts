import { handleWebhook } from '@vybekiit/payments/http';
import { fulfillOrderEffect } from '@/lib/fulfillment';
import { NextResponse } from 'next/server';

/**
 * Handle payment provider webhooks.
 *
 * @param request - Incoming webhook request with the raw provider body.
 * @returns The normalized webhook response.
 * @example
 * const response = await POST(request);
 */
export const POST = async (request: Request): Promise<NextResponse> => {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);
  const result = await handleWebhook(rawBody, headers, { fulfillOrder: fulfillOrderEffect });
  return NextResponse.json(result.body, { status: result.status });
};
