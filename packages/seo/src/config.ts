import { Schema } from 'effect';

const defaultAppUrl = 'http://localhost:3000';
const UrlString = Schema.String.pipe(
  Schema.filter((value) => URL.canParse(value), { message: () => 'must be a valid URL' }),
);

/** Runtime config for the SEO provider resolver. */
export const SeoConfigSchema = Schema.Struct({
  SEO_PROVIDER: Schema.optionalWith(Schema.Literal('local'), { default: () => 'local' as const }),
});

/** Static type inferred from {@link SeoConfigSchema}. */
export type SeoConfigType = Schema.Schema.Type<typeof SeoConfigSchema>;

/** Backward-compatible SEO config alias during the Schema migration. */
export type SeoConfig = SeoConfigType;

/** App URL config needed for SEO URL construction. */
export const SeoAppConfigSchema = Schema.Struct({
  APP_URL: Schema.optionalWith(UrlString, { default: () => defaultAppUrl }),
  NODE_ENV: Schema.optionalWith(Schema.Literal('development', 'production'), {
    default: () => 'development' as const,
  }),
});

/** Static type inferred from {@link SeoAppConfigSchema}. */
export type SeoAppConfigType = Schema.Schema.Type<typeof SeoAppConfigSchema>;
