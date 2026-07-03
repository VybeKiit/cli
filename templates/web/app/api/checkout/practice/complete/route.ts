import {
  handlePracticeComplete,
  PracticeCompleteBodySchema,
} from '@vybekiit/payments/http';
import { decodeJsonBody, readRequestJson } from '@vybekiit/core/http';
import { fulfillOrder } from '@/lib/fulfillment';
import { NextResponse } from 'next/server';

/**
 * Complete a practice-mode checkout — simulates provider success + webhook fulfillment
 * when no payment keys are configured. Real purchases use the hosted checkout +
 * `/api/webhook` once the `setup-payments` skill wires a provider.
 *
 * POST body: `{ productId: string }`.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const json = await readRequestJson(request);
  if (!json.ok) {
    return NextResponse.json(json.response.body, { status: json.response.status });
  }
  const parsed = decodeJsonBody(json.body, PracticeCompleteBodySchema, 'productId is required.');
  if (!parsed.ok) {
    return NextResponse.json(parsed.response.body, { status: parsed.response.status });
  }
  const result = await handlePracticeComplete(parsed.body, { fulfillOrder });
  return NextResponse.json(result.body, { status: result.status });
}
