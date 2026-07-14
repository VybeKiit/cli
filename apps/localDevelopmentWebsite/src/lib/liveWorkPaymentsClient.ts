import { Effect, Schema } from 'effect';
import {
  decodeLiveWorkApiResponse,
  LiveWorkApiFailureSchema,
  LiveWorkEventSchema,
} from './liveWorkApiResponse';

/**
 * Browser client for real payments Live work (ADR-0039).
 * Calls the Next API route; never receives payment API secrets.
 */

const LiveWorkPaymentsApiSuccessSchema = Schema.Struct({
  ok: Schema.Literal(true),
  provider: Schema.String,
  ephemeral: Schema.Literal(false),
  hopped: Schema.Boolean,
  fromProvider: Schema.optional(Schema.String),
  skipped: Schema.Array(Schema.String),
  verified: Schema.Literal(true),
  buyerMessage: Schema.String,
  pinKeys: Schema.Array(Schema.String),
  pinned: Schema.Boolean,
  events: Schema.Array(LiveWorkEventSchema),
});

const LiveWorkPaymentsApiResultSchema = Schema.Union(
  LiveWorkPaymentsApiSuccessSchema,
  LiveWorkApiFailureSchema,
);

export type LiveWorkPaymentsApiSuccess = Schema.Schema.Type<
  typeof LiveWorkPaymentsApiSuccessSchema
>;
export type LiveWorkPaymentsApiFailure = Schema.Schema.Type<typeof LiveWorkApiFailureSchema>;

export type LiveWorkPaymentsApiResult = LiveWorkPaymentsApiSuccess | LiveWorkPaymentsApiFailure;

/**
 * POST real payments Live work to the local console API.
 *
 * @param options - Mode and optional named vendor stick.
 * @returns Public JSON (no API secrets).
 * @example
 * const apiResult = await postLiveWorkPayments({ mode: 'demo', vendor: 'stripe' });
 */
export const postLiveWorkPayments = async (options: {
  readonly mode?: 'demo' | 'dogfood' | 'buyer';
  readonly vendor?: 'lemon-squeezy' | 'stripe' | 'paypal';
  readonly fresh?: boolean;
}): Promise<LiveWorkPaymentsApiResult> => {
  const response = await fetch('/api/live-work/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: options.mode ?? 'demo',
      ...(options.vendor === undefined ? {} : { vendor: options.vendor }),
      fresh: options.fresh === true,
    }),
  });

  const responseBody: unknown = await response.json();
  return Effect.runPromise(
    decodeLiveWorkApiResponse(responseBody, LiveWorkPaymentsApiResultSchema),
  );
};

/**
 * Whether the console should call the real payments Live work API instead of fixtures.
 * Shares the same opt-in as data/host Live work (ADR-0039).
 *
 * @param search - window.location.search.
 * @param env - process.env-like map (NEXT_PUBLIC_* only on client).
 * @returns True when live payments path is requested.
 * @example
 * shouldUseLiveWorkPayments('?live=1', {}) // true
 */
export const shouldUseLiveWorkPayments = (
  search: string,
  env: Record<string, string | undefined>,
): boolean => {
  if (env.NEXT_PUBLIC_LIVE_WORK === '1') {
    return true;
  }
  return search.includes('live=1') || search.includes('live=true');
};
