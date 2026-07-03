import { Either, Schema } from 'effect';

export const FirebaseServiceAccountSchema = Schema.Struct({
  project_id: Schema.String,
  private_key: Schema.String,
  client_email: Schema.String,
});

const decodeServiceAccount = Schema.decodeUnknownEither(FirebaseServiceAccountSchema);

/** Parse Firebase service-account JSON with required cert fields. */
export function parseFirebaseServiceAccount(raw: unknown): Record<string, unknown> {
  const parsed = decodeServiceAccount(raw);
  if (Either.isLeft(parsed)) {
    throw new Error('Firebase service account JSON is missing required fields.');
  }
  return parsed.right as Record<string, unknown>;
}
