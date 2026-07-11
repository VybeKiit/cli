import {
  createWebhook,
  deleteWebhook,
  lemonSqueezySetup,
  listWebhooks,
  type NewWebhook,
} from '@lemonsqueezy/lemonsqueezy.js';
import { RECOMMENDED_WEBHOOK_EVENTS, sameWebhookUrl } from 'fresh-squeezy';

/**
 * VybeKiit's own store admin for Lemon Squeezy webhooks — thin, typed create/list/delete
 * over the official SDK (ADR-0037). This is operator tooling for the VybeKiit store itself:
 * it is excluded from the shipped bundle and never imported by the runtime webhook handler.
 */

/** A Lemon Squeezy webhook, mapped to what we act on. Never carries the signing secret (the API omits it). */
export type StoreWebhook = {
  /** Lemon Squeezy webhook id. */
  readonly id: string;
  /** Endpoint the events are delivered to. */
  readonly url: string;
  /** Subscribed event names, e.g. `order_created`. */
  readonly events: readonly string[];
  /** Whether the webhook lives in the store's test environment. */
  readonly testMode: boolean;
};

/**
 * The webhook events a one-time-purchase kit actually handles: the `order_*` subset of
 * fresh-squeezy's {@link RECOMMENDED_WEBHOOK_EVENTS}. Subscribing to the `subscription_*`
 * recommendations would only accrue failed deliveries here — the handler rejects them.
 */
export const ORDER_WEBHOOK_EVENTS: readonly string[] = RECOMMENDED_WEBHOOK_EVENTS.filter((event) =>
  event.startsWith('order_'),
);

type WebhookResource = {
  readonly id?: string;
  readonly attributes?: {
    readonly url?: string;
    readonly events?: readonly string[];
    readonly test_mode?: boolean;
  };
};

type SdkResponse = {
  readonly statusCode: number | null;
  readonly data: unknown;
  readonly error: unknown;
};

/**
 * Unwrap a Lemon Squeezy SDK response, throwing a readable error on the failure arm.
 *
 * @param response - A `FetchResponse` from any SDK call.
 * @param action - Human-readable action name for the error message.
 * @returns The response payload when the call succeeded.
 * @example
 * const document = unwrapSdk(await listWebhooks(), 'list webhooks');
 */
const unwrapSdk = (response: SdkResponse, action: string): unknown => {
  if (response.error !== null && response.error !== undefined) {
    const detail =
      response.error instanceof Error ? response.error.message : String(response.error);
    throw new Error(
      `Lemon Squeezy ${action} failed (HTTP ${response.statusCode ?? 'unknown'}): ${detail}`,
    );
  }
  if (response.data === null || response.data === undefined) {
    throw new Error(`Lemon Squeezy ${action} returned no data.`);
  }
  return response.data;
};

/**
 * Map a raw Lemon Squeezy webhook resource to the internal {@link StoreWebhook}.
 *
 * @param resource - JSON:API webhook resource from the SDK.
 * @returns The mapped webhook (without the secret).
 */
const toStoreWebhook = (resource: WebhookResource): StoreWebhook => ({
  id: resource.id ?? '',
  url: resource.attributes?.url ?? '',
  events: resource.attributes?.events ?? [],
  testMode: resource.attributes?.test_mode ?? false,
});

/**
 * Point the Lemon Squeezy SDK at a store's API key. Call once before the other admin
 * functions — they read the key from the SDK's module-level config.
 *
 * @param apiKey - Lemon Squeezy API key (its mode decides test vs live).
 * @example
 * configureLemonSqueezy(process.env.LEMONSQUEEZY_API_KEY ?? '');
 */
export const configureLemonSqueezy = (apiKey: string): void => {
  lemonSqueezySetup({ apiKey });
};

/**
 * List every webhook registered on a store.
 *
 * @param storeId - Lemon Squeezy store id.
 * @returns The store's webhooks, secrets omitted.
 * @example
 * const webhooks = await listStoreWebhooks('270009');
 */
export const listStoreWebhooks = async (storeId: string): Promise<readonly StoreWebhook[]> => {
  const document = unwrapSdk(await listWebhooks({ filter: { storeId } }), 'list webhooks') as {
    readonly data?: readonly WebhookResource[];
  };
  return (document.data ?? []).map(toStoreWebhook);
};

/**
 * Find a store webhook by endpoint URL, tolerant of trailing-slash/case differences
 * (via fresh-squeezy's {@link sameWebhookUrl}). Optionally require the same test/live
 * mode so a live webhook never shadows a test-mode registration (or vice versa).
 *
 * @param storeId - Lemon Squeezy store id.
 * @param url - Endpoint URL to match.
 * @param testMode - When set, only match webhooks in that mode.
 * @returns The matching webhook, or `null`.
 * @example
 * const hook = await findStoreWebhookByUrl('270009', 'https://vybekiit.com/api/webhook', true);
 */
export const findStoreWebhookByUrl = async (
  storeId: string,
  url: string,
  testMode?: boolean,
): Promise<StoreWebhook | null> => {
  const webhooks = await listStoreWebhooks(storeId);
  return (
    webhooks.find(
      (webhook) =>
        sameWebhookUrl(webhook.url, url) &&
        (testMode === undefined || webhook.testMode === testMode),
    ) ?? null
  );
};

/** Inputs for creating a store webhook. */
export type CreateStoreWebhookParams = {
  /** Lemon Squeezy store id. */
  readonly storeId: string;
  /** Endpoint that should receive events. */
  readonly url: string;
  /** Signing secret — must match the receiver's `LEMONSQUEEZY_WEBHOOK_SECRET`. */
  readonly secret: string;
  /** Event names (defaults to {@link ORDER_WEBHOOK_EVENTS}). */
  readonly events?: readonly string[];
  /** Create in the test environment (default `true`). */
  readonly testMode?: boolean;
};

/**
 * Create a webhook on a store.
 *
 * @param params - Store id, URL, signing secret, and optional events/mode.
 * @returns The created webhook (secret omitted).
 * @example
 * const hook = await createStoreWebhook({ storeId: '270009', url, secret });
 */
export const createStoreWebhook = async (
  params: CreateStoreWebhookParams,
): Promise<StoreWebhook> => {
  const newWebhook: NewWebhook = {
    url: params.url,
    secret: params.secret,
    // Bridge our string[] event list to the SDK's event union at the boundary.
    events: (params.events ?? ORDER_WEBHOOK_EVENTS) as unknown as NewWebhook['events'],
    testMode: params.testMode ?? true,
  };
  const document = unwrapSdk(await createWebhook(params.storeId, newWebhook), 'create webhook') as {
    readonly data?: WebhookResource;
  };
  if (document.data === undefined) {
    throw new Error('Lemon Squeezy create webhook returned an empty resource.');
  }
  return toStoreWebhook(document.data);
};

/** The outcome of {@link ensureStoreWebhook}. */
export type EnsureStoreWebhookResult = {
  /** The present-or-created webhook. */
  readonly webhook: StoreWebhook;
  /** `true` when a new webhook was created, `false` when one already matched the URL. */
  readonly created: boolean;
};

/**
 * Ensure exactly one webhook points at `url` — return the existing one if present,
 * otherwise create it. Idempotent, so re-running provisioning never duplicates.
 *
 * @param params - Same inputs as {@link createStoreWebhook}.
 * @returns The webhook and whether it was newly created.
 * @example
 * const { webhook, created } = await ensureStoreWebhook({ storeId, url, secret });
 */
export const ensureStoreWebhook = async (
  params: CreateStoreWebhookParams,
): Promise<EnsureStoreWebhookResult> => {
  const wantTestMode = params.testMode ?? true;
  const existing = await findStoreWebhookByUrl(params.storeId, params.url, wantTestMode);
  if (existing !== null) {
    return { webhook: existing, created: false };
  }
  return { webhook: await createStoreWebhook(params), created: true };
};

/**
 * Delete a webhook by id.
 *
 * @param webhookId - Lemon Squeezy webhook id.
 * @example
 * await deleteStoreWebhook('115148');
 */
export const deleteStoreWebhook = async (webhookId: string): Promise<void> => {
  const response = await deleteWebhook(webhookId);
  // Lemon Squeezy returns 204 No Content; the SDK then surfaces an empty-body
  // JSON-parse "error" even though the delete succeeded — so trust a 2xx status.
  const status = response.statusCode ?? 0;
  if (status >= 200 && status < 300) {
    return;
  }
  const detail =
    response.error instanceof Error ? response.error.message : String(response.error ?? 'unknown');
  throw new Error(
    `Lemon Squeezy delete webhook ${webhookId} failed (HTTP ${response.statusCode ?? 'unknown'}): ${detail}`,
  );
};
