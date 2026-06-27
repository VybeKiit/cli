import { lemonSqueezyConfigSchema, parseEnv } from '@vybekiit/core';
import { createCheckout } from '@vybekiit/pay-lemonsqueezy';
import { NextResponse } from 'next/server';

/**
 * Start a purchase: create a Lemon Squeezy checkout for the given variant and
 * carry the buyer's GitHub username through as custom data so the webhook can
 * invite that exact account once payment clears.
 *
 * POST body: `{ variantId: string, githubUsername: string, email?: string }`
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { variantId, githubUsername, email } = await request.json();
  if (!variantId || !githubUsername) {
    return NextResponse.json(
      { error: 'variantId and githubUsername are required.' },
      { status: 400 },
    );
  }

  const config = parseEnv(lemonSqueezyConfigSchema);
  const result = await createCheckout(config, {
    variantId,
    githubUsername,
    email,
    redirectUrl: process.env.APP_URL,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }
  return NextResponse.json({ url: result.value.url });
}
