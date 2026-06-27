import { PAYPAL_API_BASE, type PaypalConfig, type Result, fail, ok } from '@vybekiit/core';
import { z } from 'zod';
import type { OrderEvent } from '../../types';

/**
 * PayPal webhook envelope (only the fields VybeKiit reads). PayPal nests the
 * GitHub username (sent as `custom_id` at order creation) differently per event:
 * order events carry it on `resource.purchase_units[].custom_id`; capture events
 * carry it on `resource.custom_id`. `.passthrough()` tolerates PayPal's extra keys.
 */
const eventSchema = z.object({
  event_type: z.string().min(1),
  resource: z
    .object({
      id: z.string().optional(),
      custom_id: z.string().optional(),
      payer: z.object({ email_address: z.string().optional() }).optional(),
      purchase_units: z.array(z.object({ custom_id: z.string().optional() })).optional(),
    })
    .passthrough(),
});

type PayPalEvent = z.infer<typeof eventSchema>;

const tokenSchema = z.object({ access_token: z.string() });
const verifySchema = z.object({ verification_status: z.string() });

/** Map a verified PayPal event to the normalized {@link OrderEvent} (pure — unit tested). */
export function mapPayPalEvent(event: PayPalEvent): OrderEvent {
  const { resource } = event;
  return {
    provider: 'paypal',
    eventName: event.event_type,
    orderId: resource.id ?? '',
    customerEmail: resource.payer?.email_address ?? null,
    githubUsername: resource.custom_id ?? resource.purchase_units?.[0]?.custom_id ?? null,
    isRefund: event.event_type.includes('REFUND'),
  };
}

/** Fetch a client-credentials access token — required to call PayPal's verify endpoint. */
async function getAccessToken(config: PaypalConfig): Promise<string | null> {
  const credentials = Buffer.from(
    `${config.PAYPAL_CLIENT_ID}:${config.PAYPAL_CLIENT_SECRET}`,
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE[config.PAYPAL_ENV]}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) return null;

  const parsed = tokenSchema.safeParse(await response.json());
  return parsed.success ? parsed.data.access_token : null;
}

/**
 * Verify a PayPal webhook and map it to an {@link OrderEvent}.
 *
 * Unlike Lemon Squeezy / Stripe (local HMAC), PayPal verifies server-side: we post
 * the transmission headers + the raw event back to PayPal keyed by our webhook id,
 * and trust it only on `verification_status === 'SUCCESS'`. Hence this adapter's
 * `parseWebhook` is genuinely async.
 */
export async function parsePayPalWebhook(
  config: PaypalConfig,
  rawBody: string,
  headers: Record<string, string | undefined>,
): Promise<Result<OrderEvent>> {
  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return fail('invalid_body', 'Webhook body was not valid JSON.');
  }

  const token = await getAccessToken(config);
  if (!token) {
    return fail('auth_error', 'Could not authenticate with PayPal to verify the webhook.');
  }

  let verification: Result<OrderEvent> | null = null;
  try {
    const response = await fetch(
      `${PAYPAL_API_BASE[config.PAYPAL_ENV]}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: config.PAYPAL_WEBHOOK_ID,
          webhook_event: event,
        }),
      },
    );
    const parsed = verifySchema.safeParse(await response.json());
    if (!parsed.success || parsed.data.verification_status !== 'SUCCESS') {
      verification = fail('invalid_signature', 'PayPal webhook signature did not verify.');
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown network error';
    return fail('network_error', `Could not reach PayPal: ${detail}`);
  }
  if (verification) return verification;

  const parsed = eventSchema.safeParse(event);
  if (!parsed.success) {
    return fail('invalid_shape', 'Webhook payload was missing expected fields.');
  }
  return ok(mapPayPalEvent(parsed.data));
}
