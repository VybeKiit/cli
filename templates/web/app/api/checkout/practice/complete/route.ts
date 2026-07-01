import { handlePracticeComplete } from '@vybekiit/payments/http';
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
  const body = await request.json();
  const result = await handlePracticeComplete(body, { fulfillOrder });
  return NextResponse.json(result.body, { status: result.status });
}
