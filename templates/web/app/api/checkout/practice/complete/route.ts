import { handlePracticeComplete, PracticeCompleteBodySchema } from '@vybekiit/payments/http';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { fulfillOrderEffect } from '@/lib/fulfillment';
import { NextResponse } from 'next/server';

/**
 * Complete a practice-mode checkout.
 *
 * @param request - Incoming request with `{ productId: string }` JSON.
 * @returns The practice checkout completion response.
 * @example
 * const response = await POST(request);
 */
export const POST = async (request: Request): Promise<NextResponse> => {
  const json = await readRequestJson(request);
  if (!json.ok) {
    return NextResponse.json(json.response.body, { status: json.response.status });
  }
  const parsed = decodeJsonBody(json.body, PracticeCompleteBodySchema, 'productId is required.');
  if (!parsed.ok) {
    return NextResponse.json(parsed.response.body, { status: parsed.response.status });
  }
  const result = await handlePracticeComplete(parsed.body, { fulfillOrder: fulfillOrderEffect });
  return NextResponse.json(result.body, { status: result.status });
};
