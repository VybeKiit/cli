import { PostHog } from 'posthog-node';
import type { AnalyticsEventName, AnalyticsProperties } from '@/lib/analyticsEvents';

/**
 * Build a short-lived PostHog Node client for serverless handlers.
 * Flush immediately (`flushAt: 1`) so events leave before the isolate freezes.
 *
 * @returns A PostHog client, or `null` when the project token is unset.
 * @example
 * const client = createPostHogServerClient();
 * if (client) { client.capture({…}); await client.shutdown(); }
 */
const createPostHogServerClient = (): PostHog | null => {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (token === undefined || token.length === 0) {
    return null;
  }
  return new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  });
};

/**
 * Capture a server-side analytics event and flush the queue.
 *
 * @param distinctId - Stable person id (prefer email; fallback `anonymous`).
 * @param event - Event name from {@link AnalyticsEvent}.
 * @param properties - Optional event properties.
 * @returns Resolves when the event is flushed (or skipped).
 * @example
 * await captureServerEvent(email, AnalyticsEvent.checkoutSessionCreated, { product: 'vybekiit' });
 */
export const captureServerEvent = async (
  distinctId: string,
  event: AnalyticsEventName,
  properties?: AnalyticsProperties,
): Promise<void> => {
  const client = createPostHogServerClient();
  if (client === null) {
    return;
  }
  try {
    if (properties === undefined) {
      client.capture({
        distinctId: distinctId.length > 0 ? distinctId : 'anonymous',
        event,
      });
    } else {
      client.capture({
        distinctId: distinctId.length > 0 ? distinctId : 'anonymous',
        event,
        properties: { ...properties },
      });
    }
    await client.shutdown();
  } catch {
    // Never fail a money/gate path because analytics is down.
  }
};
