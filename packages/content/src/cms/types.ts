import { Data, type Effect, Schema } from 'effect';
import type { CmsProviderNameType } from './config';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** CMS page record returned by provider adapters. */
export const CmsPage = Schema.Struct({
  slug: NonEmptyString,
  title: NonEmptyString,
  description: Schema.optional(Schema.String),
  body: Schema.optional(Schema.String),
});

/** Static type inferred from {@link CmsPage}. */
export type CmsPageType = Schema.Schema.Type<typeof CmsPage>;

/** Backward-compatible CMS page alias during the Schema migration. */
export type CmsPage = CmsPageType;

/** CMS metadata returned for page-level SEO. */
export const CmsMetadata = Schema.Struct({
  title: NonEmptyString,
  description: Schema.String,
});

/** Static type inferred from {@link CmsMetadata}. */
export type CmsMetadataType = Schema.Schema.Type<typeof CmsMetadata>;

/** Expected CMS provider failure. */
export class CmsError extends Data.TaggedError('CmsError')<{
  readonly code: 'CMS_CONFIG_INVALID' | 'CMS_PROVIDER_UNSUPPORTED' | 'CMS_READ_FAILED';
  readonly message: string;
}> {}

/** Effect service contract for headless CMS content. */
export type CmsService = {
  readonly name: CmsProviderNameType;
  readonly getPage: (slug: string) => Effect.Effect<CmsPageType | null, CmsError>;
  readonly listPages: () => Effect.Effect<readonly CmsPageType[], CmsError>;
  readonly getMetadata: (slug: string) => Effect.Effect<CmsMetadataType | null, CmsError>;
};

/** Promise-based compatibility provider kept while templates migrate to Effect. */
export type CmsProvider = {
  readonly name: CmsProviderNameType;
  readonly getPage: (slug: string) => Promise<CmsPageType | null>;
  readonly listPages: () => Promise<readonly CmsPageType[]>;
  readonly getMetadata: (slug: string) => Promise<CmsMetadataType | null>;
};
