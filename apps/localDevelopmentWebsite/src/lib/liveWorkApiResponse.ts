import { Effect, Schema } from 'effect';

export const LiveWorkEventSchema = Schema.Struct({
  name: Schema.String,
  phase: Schema.Literal('start', 'end', 'error'),
  detail: Schema.optional(Schema.String),
});

export const LiveWorkApiFailureSchema = Schema.Struct({
  ok: Schema.Literal(false),
  code: Schema.String,
  message: Schema.String,
  hopClass: Schema.optional(Schema.String),
  provider: Schema.optional(Schema.String),
  events: Schema.Array(LiveWorkEventSchema),
});

export type LiveWorkApiFailure = Schema.Schema.Type<typeof LiveWorkApiFailureSchema>;

const invalidResponse: LiveWorkApiFailure = {
  ok: false,
  code: 'invalid_response',
  message: 'The local Live Work API returned an invalid response.',
  events: [],
};

/** Decode an untrusted local Live Work response into its declared API contract. */
export const decodeLiveWorkApiResponse = <Decoded, Encoded, Requirements>(
  responseBody: unknown,
  responseSchema: Schema.Schema<Decoded, Encoded, Requirements>,
): Effect.Effect<Decoded | LiveWorkApiFailure, never, Requirements> =>
  Schema.decodeUnknown(responseSchema)(responseBody).pipe(
    Effect.catchAll(() => Effect.succeed(invalidResponse)),
  );
