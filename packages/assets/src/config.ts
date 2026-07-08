import { Schema } from 'effect';

const defaultAppUrl = 'http://localhost:3000';
const NonEmptyString = Schema.String.pipe(Schema.minLength(1));
const UrlString = Schema.String.pipe(
  Schema.filter((value) => URL.canParse(value), { message: () => 'must be a valid URL' }),
);

/** Hosting keys the asset resolver understands. */
export const AssetHostingProviderSchema = Schema.Literal(
  'local',
  'cloudflare',
  'vercel',
  'aws',
  'railway',
);

/** Static type inferred from {@link AssetHostingProviderSchema}. */
export type AssetHostingProviderType = Schema.Schema.Type<typeof AssetHostingProviderSchema>;

/** Asset hosting selector config; absent env means local asset delivery. */
export const AssetHostingConfigSchema = Schema.Struct({
  HOSTING_PROVIDER: Schema.optionalWith(AssetHostingProviderSchema, {
    default: () => 'local' as const,
  }),
});

/** Static type inferred from {@link AssetHostingConfigSchema}. */
export type AssetHostingConfigType = Schema.Schema.Type<typeof AssetHostingConfigSchema>;

/** Storage keys used under the Cloudflare hosting path. */
export const AssetStorageProviderSchema = Schema.Literal('supabase', 'r2', 's3');

/** Static type inferred from {@link AssetStorageProviderSchema}. */
export type AssetStorageProviderType = Schema.Schema.Type<typeof AssetStorageProviderSchema>;

/** Asset storage selector config. */
export const AssetStorageConfigSchema = Schema.Struct({
  STORAGE_PROVIDER: Schema.optionalWith(AssetStorageProviderSchema, {
    default: () => 'supabase' as const,
  }),
});

/** Static type inferred from {@link AssetStorageConfigSchema}. */
export type AssetStorageConfigType = Schema.Schema.Type<typeof AssetStorageConfigSchema>;

/** App URL config needed for CDN URL construction. */
export const AssetAppConfigSchema = Schema.Struct({
  APP_URL: Schema.optionalWith(UrlString, { default: () => defaultAppUrl }),
  NODE_ENV: Schema.optionalWith(Schema.Literal('development', 'production'), {
    default: () => 'development' as const,
  }),
});

/** Static type inferred from {@link AssetAppConfigSchema}. */
export type AssetAppConfigType = Schema.Schema.Type<typeof AssetAppConfigSchema>;

/** Cloudflare credentials needed by Cloudflare-backed asset delivery. */
export const AssetCloudflareConfigSchema = Schema.Struct({
  CLOUDFLARE_ACCOUNT_ID: NonEmptyString,
  CLOUDFLARE_API_TOKEN: NonEmptyString,
});

/** Static type inferred from {@link AssetCloudflareConfigSchema}. */
export type AssetCloudflareConfigType = Schema.Schema.Type<typeof AssetCloudflareConfigSchema>;

/** Cloudflare R2 credentials and public object origin. */
export const AssetR2ConfigSchema = Schema.Struct({
  R2_ACCOUNT_ID: NonEmptyString,
  R2_BUCKET: NonEmptyString,
  R2_ACCESS_KEY_ID: NonEmptyString,
  R2_SECRET_ACCESS_KEY: NonEmptyString,
  R2_PUBLIC_URL: UrlString,
});

/** Static type inferred from {@link AssetR2ConfigSchema}. */
export type AssetR2ConfigType = Schema.Schema.Type<typeof AssetR2ConfigSchema>;

/** Supabase storage config used for public upload URLs. */
export const AssetSupabaseConfigSchema = Schema.Struct({
  SUPABASE_URL: UrlString,
  SUPABASE_ANON_KEY: NonEmptyString,
});

/** Static type inferred from {@link AssetSupabaseConfigSchema}. */
export type AssetSupabaseConfigType = Schema.Schema.Type<typeof AssetSupabaseConfigSchema>;

/** AWS S3 config used for asset delivery URLs. */
export const AssetAwsConfigSchema = Schema.Struct({
  AWS_REGION: NonEmptyString,
  AWS_CLOUDFRONT_DOMAIN: Schema.optional(UrlString),
});

/** Static type inferred from {@link AssetAwsConfigSchema}. */
export type AssetAwsConfigType = Schema.Schema.Type<typeof AssetAwsConfigSchema>;
