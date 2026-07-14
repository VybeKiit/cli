import { Effect, Schema } from 'effect';
import {
  decodeLiveWorkApiResponse,
  LiveWorkApiFailureSchema,
  LiveWorkEventSchema,
} from './liveWorkApiResponse';

/**
 * Browser client for real host Live work (ADR-0039).
 * Calls the Next API route; never receives host API tokens.
 */

const LiveWorkHostApiSuccessSchema = Schema.Struct({
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
  tornDown: Schema.optional(Schema.Boolean),
  url: Schema.optional(Schema.String),
  events: Schema.Array(LiveWorkEventSchema),
});

const LiveWorkHostApiResultSchema = Schema.Union(
  LiveWorkHostApiSuccessSchema,
  LiveWorkApiFailureSchema,
);

export type LiveWorkHostApiSuccess = Schema.Schema.Type<typeof LiveWorkHostApiSuccessSchema>;
export type LiveWorkHostApiFailure = Schema.Schema.Type<typeof LiveWorkApiFailureSchema>;

export type LiveWorkHostApiResult = LiveWorkHostApiSuccess | LiveWorkHostApiFailure;

/**
 * POST real host Live work to the local console API.
 *
 * @param options - Mode and optional named vendor stick.
 * @returns Public JSON (no API tokens).
 * @example
 * const apiResult = await postLiveWorkHost({ mode: 'demo', vendor: 'cloudflare' });
 */
export const postLiveWorkHost = async (options: {
  readonly mode?: 'demo' | 'dogfood' | 'buyer';
  readonly vendor?: 'cloudflare' | 'render' | 'railway' | 'vercel';
  readonly fresh?: boolean;
}): Promise<LiveWorkHostApiResult> => {
  const response = await fetch('/api/live-work/host', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: options.mode ?? 'demo',
      ...(options.vendor === undefined ? {} : { vendor: options.vendor }),
      fresh: options.fresh === true,
    }),
  });

  const responseBody: unknown = await response.json();
  return Effect.runPromise(decodeLiveWorkApiResponse(responseBody, LiveWorkHostApiResultSchema));
};

/**
 * Whether the console should call the real host Live work API instead of fixtures.
 * Shares the same opt-in as data Live work (ADR-0039).
 *
 * @param search - window.location.search.
 * @param env - process.env-like map (NEXT_PUBLIC_* only on client).
 * @returns True when live host path is requested.
 * @example
 * shouldUseLiveWorkHost('?live=1', {}) // true
 */
export const shouldUseLiveWorkHost = (
  search: string,
  env: Record<string, string | undefined>,
): boolean => {
  if (env.NEXT_PUBLIC_LIVE_WORK === '1') {
    return true;
  }
  return search.includes('live=1') || search.includes('live=true');
};
