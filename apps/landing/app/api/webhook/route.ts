import { resolvePaymentProvider } from '@vybekiit/payments';
import { Effect, Either } from 'effect';
import { NextResponse } from 'next/server';
import { AnalyticsEvent } from '@/lib/analyticsEvents';
import { captureServerEvent } from '@/lib/analyticsServer';
import { processStorePaymentEvent } from '@/lib/storeOrderPipeline';

/**
 * The VybeKiit store's money pipeline: payment provider → StoreOrderPipeline.
 *
 * Composition root only: verify signature → process sale → analytics + JSON.
 * Policy (ledger best-effort, ladder, AccessGate) lives in
 * {@link processStorePaymentEvent}.
 *
 * @param request - Incoming payment webhook request.
 * @returns JSON response describing whether the order was recorded and gate access changed.
 * @example
 * const response = await POST(request);
 */
const POST = async (request: Request): Promise<NextResponse> => {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  const webhook = await Effect.runPromise(
    Effect.either(resolvePaymentProvider().parseWebhook(rawBody, headers)),
  );
  if (Either.isLeft(webhook)) {
    return NextResponse.json({ error: webhook.left.message }, { status: 400 });
  }

  const event = webhook.right;
  const distinctId =
    event.customerEmail !== null && event.customerEmail.length > 0
      ? event.customerEmail.trim().toLowerCase()
      : event.orderId;

  const fulfilled = await Effect.runPromise(Effect.either(processStorePaymentEvent(event)));
  if (Either.isLeft(fulfilled)) {
    return NextResponse.json({ error: fulfilled.left.message }, { status: 502 });
  }

  const result = fulfilled.right;

  await captureServerEvent(
    distinctId,
    event.isRefund ? AnalyticsEvent.orderRefunded : AnalyticsEvent.orderFulfilled,
    {
      order_id: event.orderId,
      gated: result.gated,
      recorded: result.recorded,
      is_refund: event.isRefund,
      github_username: event.githubUsername,
      action: result.action,
      ladder_bumped: result.ladderBumped,
      ladder_sale_count: result.ladder?.saleCount ?? null,
      ladder_next_price_usd: result.ladder?.amount ?? null,
    },
  );

  return NextResponse.json({
    ok: true,
    gated: result.gated,
    action: result.action === 'skipped' ? undefined : result.action,
    recorded: result.recorded,
    ladderBumped: result.ladderBumped,
    ladder: result.ladder,
  });
};

export { POST };
