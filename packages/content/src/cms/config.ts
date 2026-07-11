import { Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** CMS provider selector decoded from environment config. */
export const CmsProviderName = Schema.Literal('mdx', 'local');

/** Static type inferred from {@link CmsProviderName}. */
export type CmsProviderNameType = Schema.Schema.Type<typeof CmsProviderName>;

/** Backward-compatible provider-name alias during the Schema migration. */
export type CmsProviderName = CmsProviderNameType;

/** CMS provider config slice. */
export const CmsConfig = Schema.Struct({
  CMS_PROVIDER: Schema.optionalWith(CmsProviderName, { default: () => 'mdx' as const }),
});

/** Static type inferred from {@link CmsConfig}. */
export type CmsConfigType = Schema.Schema.Type<typeof CmsConfig>;

/** MDX CMS content directory config slice. */
export const MdxCmsConfig = Schema.Struct({
  CMS_CONTENT_DIR: Schema.optionalWith(NonEmptyString, { default: () => 'content' }),
});

/** Static type inferred from {@link MdxCmsConfig}. */
export type MdxCmsConfigType = Schema.Schema.Type<typeof MdxCmsConfig>;
