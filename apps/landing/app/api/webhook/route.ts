import { githubGateConfigSchema, parseEnv } from '@vybekiit/core';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { Effect, Either } from 'effect';
import { NextResponse } from 'next/server';
import { inviteToRepo, removeFromRepo } from '@/lib/gate';
import { recordOrderBestEffort } from '@/lib/orders';

/**
 * The VybeKiit store's money pipeline: payment provider → the gate.
 *
 * Verifies the signature, records the order in D1 (best-effort — see ADR-0037), then
 * invites the buyer's GitHub account on a paid order or removes it on a refund. This is
 * the v1.0 "stranger pays → gets invited" keystone (see CONTEXT.md → Build order).
 * Provider-agnostic via {@link resolvePaymentProvider} — Lemon Squeezy is the default.
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

  const { customerEmail, customerName, githubUsername, isRefund, orderId } = webhook.right;

  // Record every order in D1 first — a best-effort bookkeeping write that must never block
  // the gate (Lemon Squeezy stays the source of truth for payments). See ADR-0037.
  const recorded = await recordOrderBestEffort({
    orderId,
    email: customerEmail,
    customerName,
    githubUsername,
    refunded: isRefund,
  });

  if (!githubUsername) {
    return NextResponse.json({ ok: true, gated: false, recorded });
  }

  const gateConfig = parseEnv(githubGateConfigSchema);
  const gate = await Effect.runPromise(
    Effect.either(
      isRefund
        ? removeFromRepo(gateConfig, githubUsername)
        : inviteToRepo(gateConfig, githubUsername),
    ),
  );

  if (Either.isLeft(gate)) {
    return NextResponse.json({ error: gate.left.message }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    gated: true,
    action: isRefund ? 'removed' : 'invited',
    recorded,
  });
};

export { POST };
