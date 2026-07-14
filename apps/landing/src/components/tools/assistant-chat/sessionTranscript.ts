import type { VybeAssistant } from '@vybekiit/report-mode';
import { Data, Effect, Schema } from 'effect';

const SessionTranscriptResponseSchema = Schema.Struct({
  ok: Schema.Literal(true),
  messages: Schema.Array(
    Schema.Struct({
      role: Schema.Literal('user', 'assistant'),
      text: Schema.String,
    }),
  ),
  title: Schema.optional(Schema.String),
});

type SessionTranscriptResponse = Schema.Schema.Type<typeof SessionTranscriptResponseSchema>;

export type SessionTranscript = Omit<SessionTranscriptResponse, 'ok'>;
export type SessionTranscriptErrorCode = 'aborted' | 'request_failed' | 'invalid_response';

export class SessionTranscriptError extends Data.TaggedError('SessionTranscriptError')<{
  readonly code: SessionTranscriptErrorCode;
  readonly message: string;
}> {}

const transcriptError = (
  code: SessionTranscriptErrorCode,
  message: string,
): SessionTranscriptError => new SessionTranscriptError({ code, message });

const requestFailure = (requestSignal: AbortSignal, cause: unknown): SessionTranscriptError => {
  if (requestSignal.aborted) {
    return transcriptError('aborted', 'Session transcript loading was cancelled.');
  }
  const message = cause instanceof Error ? cause.message : 'Could not load the session transcript.';
  return transcriptError('request_failed', message);
};

/** Load and decode one native CLI transcript through the landing route contract. */
export const loadSessionTranscript = (
  sessionId: string,
  agentId: VybeAssistant,
  requestSignal: AbortSignal,
  sourcePath?: string,
): Effect.Effect<SessionTranscript, SessionTranscriptError> =>
  Effect.gen(function* () {
    if (requestSignal.aborted) {
      return yield* Effect.fail(
        transcriptError('aborted', 'Session transcript loading was cancelled.'),
      );
    }

    const searchParams = new URLSearchParams({ assistant: agentId, sessionId });
    if (sourcePath) {
      searchParams.set('sourcePath', sourcePath);
    }
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`/api/dev/session-transcript?${searchParams.toString()}`, {
          signal: requestSignal,
        }),
      catch: (cause) => requestFailure(requestSignal, cause),
    });
    if (!response.ok) {
      return yield* Effect.fail(
        transcriptError(
          'request_failed',
          `Session transcript request failed (${String(response.status)}).`,
        ),
      );
    }

    const responseBody = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: () => transcriptError('invalid_response', 'Session transcript response was not JSON.'),
    });
    const decodedResponse = yield* Schema.decodeUnknown(SessionTranscriptResponseSchema)(
      responseBody,
    ).pipe(
      Effect.mapError(() =>
        transcriptError('invalid_response', 'Session transcript response had an invalid shape.'),
      ),
    );

    return {
      messages: decodedResponse.messages,
      ...(decodedResponse.title === undefined ? {} : { title: decodedResponse.title }),
    };
  });
