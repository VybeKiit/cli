import { Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));
const UrlString = Schema.String.pipe(
  Schema.filter((value) => URL.canParse(value), { message: () => 'must be a valid URL' }),
);

/** Provider keys accepted by the KV resolver. */
export const KvProviderNameSchema = Schema.Literal('cloudflare', 'upstash', 'local');

/** Static type inferred from {@link KvProviderNameSchema}. */
export type KvProviderNameType = Schema.Schema.Type<typeof KvProviderNameSchema>;

/** Runtime config for the KV provider resolver. */
export const KvConfigSchema = Schema.Struct({
  KV_PROVIDER: Schema.optionalWith(KvProviderNameSchema, {
    default: () => 'cloudflare' as const,
  }),
});

/** Static type inferred from {@link KvConfigSchema}. */
export type KvConfigType = Schema.Schema.Type<typeof KvConfigSchema>;

/** Cloudflare account and namespace config for the KV adapter. */
export const KvCloudflareConfigSchema = Schema.Struct({
  CLOUDFLARE_ACCOUNT_ID: NonEmptyString,
  CLOUDFLARE_API_TOKEN: NonEmptyString,
  CLOUDFLARE_KV_NAMESPACE_ID: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link KvCloudflareConfigSchema}. */
export type KvCloudflareConfigType = Schema.Schema.Type<typeof KvCloudflareConfigSchema>;

/** Upstash REST config reserved for the future Upstash adapter. */
export const KvUpstashConfigSchema = Schema.Struct({
  UPSTASH_KV_REST_URL: UrlString,
  UPSTASH_KV_REST_TOKEN: NonEmptyString,
});

/** Static type inferred from {@link KvUpstashConfigSchema}. */
export type KvUpstashConfigType = Schema.Schema.Type<typeof KvUpstashConfigSchema>;
