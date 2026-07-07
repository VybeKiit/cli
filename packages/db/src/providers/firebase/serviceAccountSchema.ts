import { Either, Schema } from 'effect';

export const FirebaseServiceAccountSchema = Schema.Struct({
  project_id: Schema.String,
  private_key: Schema.String,
  client_email: Schema.String,
});

const decodeServiceAccount = Schema.decodeUnknownEither(FirebaseServiceAccountSchema);

/**
 * Parse Firebase service-account JSON with required cert fields.
 *
 * @param raw - Unknown parsed service-account JSON.
 * @returns Service-account object accepted by Firebase Admin.
 * @throws When required cert fields are missing.
 * @example
 * const serviceAccount = parseFirebaseServiceAccount(JSON.parse(raw));
 */
export const parseFirebaseServiceAccount = (raw: unknown): Record<string, unknown> => {
  const parsed = decodeServiceAccount(raw);
  if (Either.isLeft(parsed)) {
    throw new Error('Firebase service account JSON is missing required fields.');
  }
  return parsed.right as Record<string, unknown>;
};
