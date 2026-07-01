import { DEFAULT_APP_URL } from '@vybekiit/core';
import { Schema } from 'effect';

/**
 * Auth configuration — per-concern `Schema.Struct` (ADR-0022 config split, ADR-0023
 * Schema). Parsed via core's `parseEnv`; the root `.env.example` stays the single
 * source of truth for the keys themselves. Structurally identical to the zod schemas
 * `@vybekiit/core` shipped before, so resolution and fail-loud behavior are unchanged.
 */

/** A required, non-empty env string. */
const NonEmpty = Schema.String.pipe(Schema.minLength(1));

/** A string that parses as a URL — mirrors the old zod `.url()` guard. */
const UrlString = Schema.String.pipe(
  Schema.filter((value) => URL.canParse(value), { message: () => 'must be a valid URL' }),
);

/** Which auth adapter `@vybekiit/auth` constructs (ADR-0003); `better-auth` is default. */
export const AuthConfigSchema = Schema.Struct({
  AUTH_PROVIDER: Schema.optionalWith(Schema.Literal('better-auth', 'cognito', 'local'), {
    default: () => 'better-auth' as const,
  }),
});
export type AuthConfig = Schema.Schema.Type<typeof AuthConfigSchema>;

/** Which data backend is active — auth follows data to pick its better-auth binding. */
export const DataConfigSchema = Schema.Struct({
  DATA_PROVIDER: Schema.optionalWith(
    Schema.Literal('supabase', 'neon', 'firebase', 'mongodb', 'aws', 'local', 'railway'),
    { default: () => 'supabase' as const },
  ),
});
export type DataConfig = Schema.Schema.Type<typeof DataConfigSchema>;

/** MongoDB Atlas connection — the better-auth Mongo binding. */
export const MongoConfigSchema = Schema.Struct({
  MONGODB_URI: NonEmpty,
  MONGODB_DB: NonEmpty,
});
export type MongoConfig = Schema.Schema.Type<typeof MongoConfigSchema>;

/** better-auth settings (ADR-0003). `DATABASE_URL` is the Postgres binding when present. */
export const BetterAuthConfigSchema = Schema.Struct({
  BETTER_AUTH_SECRET: NonEmpty,
  BETTER_AUTH_URL: Schema.optionalWith(UrlString, { default: () => DEFAULT_APP_URL }),
  DATABASE_URL: Schema.optional(NonEmpty),
});
export type BetterAuthConfig = Schema.Schema.Type<typeof BetterAuthConfigSchema>;

/** AWS Cognito credentials — the cognito adapter (ADR-0003). */
export const CognitoConfigSchema = Schema.Struct({
  COGNITO_USER_POOL_ID: NonEmpty,
  COGNITO_CLIENT_ID: NonEmpty,
  AWS_REGION: NonEmpty,
  AWS_ACCESS_KEY_ID: Schema.optional(NonEmpty),
  AWS_SECRET_ACCESS_KEY: Schema.optional(NonEmpty),
});
export type CognitoConfig = Schema.Schema.Type<typeof CognitoConfigSchema>;
