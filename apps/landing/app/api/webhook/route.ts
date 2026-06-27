import { inviteToRepo, removeFromRepo } from '@/lib/gate';
import { githubGateConfigSchema, lemonSqueezyConfigSchema, parseEnv } from '@vybekiit/core';
import { parseWebhook } from '@vybekiit/pay-lemonsqueezy';
import { NextResponse } from 'next/server';

/**
 * The VybeKiit store's money pipeline: Lemon Squeezy → the gate.
 *
 * Verifies the signature, then invites the buyer's GitHub account on a paid order
 * or removes it on a refund. This is the v1.0 "stranger pays → gets invited"
 * keystone (see CONTEXT.md → Build order).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature') ?? '';

  const { LEMONSQUEEZY_WEBHOOK_SECRET } = parseEnv(lemonSqueezyConfigSchema);
  const event = parseWebhook(rawBody, signature, LEMONSQUEEZY_WEBHOOK_SECRET);
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
