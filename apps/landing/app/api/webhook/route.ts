import { githubGateConfigSchema, parseEnv } from '@vybekiit/core';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { Effect, Either } from 'effect';
import { NextResponse } from 'next/server';
import { inviteToRepo, removeFromRepo } from '@/lib/gate';

/**
 * The VybeKiit store's money pipeline: payment provider → the gate.
 *
 * Verifies the signature, then invites the buyer's GitHub account on a paid order
 * or removes it on a refund. This is the v1.0 "stranger pays → gets invited"
 * keystone (see CONTEXT.md → Build order). Provider-agnostic via
 * {@link resolvePaymentProvider} — Lemon Squeezy is the default.
 *
 * @param request - Incoming payment webhook request.
 * @returns JSON response describing whether gate access changed.
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

  const { githubUsername, isRefund } = webhook.right;
  if (!githubUsername) {
    return NextResponse.json({ ok: true, gated: false });
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
  return NextResponse.json({ ok: true, gated: true, action: isRefund ? 'removed' : 'invited' });
};

export { POST };
