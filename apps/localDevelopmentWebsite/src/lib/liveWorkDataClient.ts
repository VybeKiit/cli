import { Effect, Schema } from 'effect';
import {
  decodeLiveWorkApiResponse,
  LiveWorkApiFailureSchema,
  LiveWorkEventSchema,
} from './liveWorkApiResponse';

/**
 * Browser client for real data Live work (ADR-0039).
 * Calls the Next API route; never receives DATABASE_URL secrets.
 */

const LiveWorkDataApiSuccessSchema = Schema.Struct({
  ok: Schema.Literal(true),
  provider: Schema.String,
  ephemeral: Schema.Boolean,
  hopped: Schema.Boolean,
  fromProvider: Schema.optional(Schema.String),
  skipped: Schema.Array(Schema.String),
  verified: Schema.Literal(true),
  buyerMessage: Schema.String,
  pinKeys: Schema.Array(Schema.String),
  pinned: Schema.Boolean,
  claimUrl: Schema.optional(Schema.String),
  claimableId: Schema.optional(Schema.String),
  events: Schema.Array(LiveWorkEventSchema),
});

const LiveWorkDataApiResultSchema = Schema.Union(
  LiveWorkDataApiSuccessSchema,
  LiveWorkApiFailureSchema,
);

export type LiveWorkDataApiSuccess = Schema.Schema.Type<typeof LiveWorkDataApiSuccessSchema>;
export type LiveWorkDataApiFailure = Schema.Schema.Type<typeof LiveWorkApiFailureSchema>;

export type LiveWorkDataApiResult = LiveWorkDataApiSuccess | LiveWorkDataApiFailure;

/**
 * POST real data Live work to the local console API.
 *
 * @param options - Mode and optional named vendor stick.
 * @returns Public JSON (no connection secrets).
 * @example
 * const apiResult = await postLiveWorkData({ mode: 'demo', vendor: 'neon' });
 */
export const postLiveWorkData = async (options: {
  readonly mode?: 'demo' | 'dogfood' | 'buyer';
  readonly vendor?: 'supabase' | 'neon' | 'railway';
  readonly fresh?: boolean;
}): Promise<LiveWorkDataApiResult> => {
  const response = await fetch('/api/live-work/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: options.mode ?? 'demo',
      ...(options.vendor === undefined ? {} : { vendor: options.vendor }),
      fresh: options.fresh === true,
    }),
  });

  const responseBody: unknown = await response.json();
  return Effect.runPromise(decodeLiveWorkApiResponse(responseBody, LiveWorkDataApiResultSchema));
};

/**
 * Whether the console should call the real Live work API instead of fixtures.
 * Opt-in only so Playwright / offline demos stay secret-free (ADR-0039).
 *
 * @param search - window.location.search.
 * @param env - process.env-like map (NEXT_PUBLIC_* only on client).
 * @returns True when live data path is requested.
 * @example
 * shouldUseLiveWorkData('?live=1', {}) // true
 */
export const shouldUseLiveWorkData = (
  search: string,
  env: Record<string, string | undefined>,
): boolean => {
  if (env.NEXT_PUBLIC_LIVE_WORK === '1') {
    return true;
  }
  return search.includes('live=1') || search.includes('live=true');
};
