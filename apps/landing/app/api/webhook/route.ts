import { inviteToRepo, removeFromRepo } from '@/lib/gate';
import { githubGateConfigSchema, parseEnv } from '@vybekiit/core';
import { resolvePaymentProvider } from '@vybekiit/payments';
import { NextResponse } from 'next/server';

/**
 * The VybeKiit store's money pipeline: payment provider → the gate.
 *
 * Verifies the signature, then invites the buyer's GitHub account on a paid order
 * or removes it on a refund. This is the v1.0 "stranger pays → gets invited"
 * keystone (see CONTEXT.md → Build order). Provider-agnostic via
 * {@link resolvePaymentProvider} — Lemon Squeezy is the default.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers);

  const event = await resolvePaymentProvider().parseWebhook(rawBody, headers);
  if (!event.ok) {
    return NextResponse.json({ error: event.error.message }, { status: 400 });
  }

  const { githubUsername, isRefund } = event.value;
  if (!githubUsername) {
    return NextResponse.json({ ok: true, gated: false });
  }

  const gateConfig = parseEnv(githubGateConfigSchema);
  const result = isRefund
    ? await removeFromRepo(gateConfig, githubUsername)
    : await inviteToRepo(gateConfig, githubUsername);

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true, gated: true, action: isRefund ? 'removed' : 'invited' });
}
