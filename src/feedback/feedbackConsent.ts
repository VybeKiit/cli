import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Data, Effect, type Option, Schema } from 'effect';

export const FeedbackConsent = Schema.Struct({
  automatic: Schema.Boolean,
  session: Schema.OptionFromNullOr(Schema.NonEmptyString),
  expiresAt: Schema.optionalWith(Schema.Number, { default: () => 0 }),
});

export class FeedbackConsentError extends Data.TaggedError('FeedbackConsentError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export const readFeedbackConsent = (feedbackDirectory: string) =>
  Effect.gen(function* () {
    const consentText = yield* Effect.tryPromise({
      try: () => readFile(join(feedbackDirectory, 'feedback-consent.json'), 'utf8'),
      catch: (cause) =>
        new FeedbackConsentError({ message: 'Could not read your feedback preference.', cause }),
    }).pipe(
      Effect.catchIf(
        (failure) =>
          failure.cause instanceof Error &&
          'code' in failure.cause &&
          failure.cause.code === 'ENOENT',
        () => Effect.succeed('{"automatic":false,"session":null}'),
      ),
    );
    return yield* Schema.decodeUnknown(Schema.parseJson(FeedbackConsent))(consentText);
  });

export const saveFeedbackConsent = (
  feedbackDirectory: string,
  automatic: boolean,
  session: Option.Option<string>,
  expiresAt = 0,
) =>
  Effect.gen(function* () {
    const consentText = yield* Schema.encode(Schema.parseJson(FeedbackConsent))({
      automatic,
      session,
      expiresAt,
    });
    yield* Effect.tryPromise({
      try: async () => {
        await mkdir(feedbackDirectory, { recursive: true, mode: 0o700 });
        const consentPath = join(feedbackDirectory, 'feedback-consent.json');
        await writeFile(consentPath, consentText, { encoding: 'utf8', mode: 0o600 });
        await chmod(consentPath, 0o600);
      },
      catch: (cause) =>
        new FeedbackConsentError({ message: 'Could not save your feedback preference.', cause }),
    });
  });
