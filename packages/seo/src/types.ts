import { Data, type Effect, Schema } from 'effect';

/** Provider keys supported by the SEO resolver. */
export const SeoProviderName = Schema.Literal('local');

/** Static type inferred from {@link SeoProviderName}. */
export type SeoProviderNameType = Schema.Schema.Type<typeof SeoProviderName>;

/** Backward-compatible provider-name alias during the Schema migration. */
export type SeoProviderName = SeoProviderNameType;

/** Page kinds emitted into Open Graph and JSON-LD metadata. */
export const PageType = Schema.Literal('website', 'article');

/** Static type inferred from {@link PageType}. */
export type PageTypeType = Schema.Schema.Type<typeof PageType>;

/** Backward-compatible page-type alias during the Schema migration. */
export type PageType = PageTypeType;

/** Input used to derive canonical metadata for one page. */
export const MetadataInput = Schema.Struct({
  title: Schema.String,
  description: Schema.optional(Schema.String),
  path: Schema.optional(Schema.String),
  type: Schema.optional(PageType),
  publishedAt: Schema.optional(Schema.String),
  author: Schema.optional(Schema.String),
});

/** Static type inferred from {@link MetadataInput}. */
export type MetadataInputType = Schema.Schema.Type<typeof MetadataInput>;

/** Backward-compatible metadata input alias during the Schema migration. */
export type MetadataInput = MetadataInputType;

/** Canonical page metadata used by framework adapters. */
export const MetadataOutput = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  canonicalUrl: Schema.optional(Schema.String),
});

/** Static type inferred from {@link MetadataOutput}. */
export type MetadataOutputType = Schema.Schema.Type<typeof MetadataOutput>;

/** Backward-compatible metadata output alias during the Schema migration. */
export type MetadataOutput = MetadataOutputType;

/** Open Graph metadata emitted for social sharing. */
export const OpenGraphOutput = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  url: Schema.String,
  type: PageType,
});

/** Static type inferred from {@link OpenGraphOutput}. */
export type OpenGraphOutputType = Schema.Schema.Type<typeof OpenGraphOutput>;

/** Backward-compatible Open Graph output alias during the Schema migration. */
export type OpenGraphOutput = OpenGraphOutputType;

/** Schema.org JSON-LD object, serializable for `<script type="application/ld+json">`. */
export const JsonLdBlock = Schema.Record({ key: Schema.String, value: Schema.Unknown });

/** Static type inferred from {@link JsonLdBlock}. */
export type JsonLdBlockType = Schema.Schema.Type<typeof JsonLdBlock>;

/** Backward-compatible JSON-LD block alias during the Schema migration. */
export type JsonLdBlock = JsonLdBlockType;

/** One page entry in the generated `llms.txt` file. */
export const LlmsTxtPage = Schema.Struct({
  path: Schema.String,
  title: Schema.String,
  summary: Schema.optional(Schema.String),
});

/** Static type inferred from {@link LlmsTxtPage}. */
export type LlmsTxtPageType = Schema.Schema.Type<typeof LlmsTxtPage>;

/** Backward-compatible llms.txt page alias during the Schema migration. */
export type LlmsTxtPage = LlmsTxtPageType;

/** Inputs used to generate a compact `llms.txt` index. */
export const LlmsTxtOptions = Schema.Struct({
  siteName: Schema.String,
  siteDescription: Schema.String,
  pages: Schema.Array(LlmsTxtPage),
});

/** Static type inferred from {@link LlmsTxtOptions}. */
export type LlmsTxtOptionsType = Schema.Schema.Type<typeof LlmsTxtOptions>;

/** Backward-compatible llms.txt options alias during the Schema migration. */
export type LlmsTxtOptions = LlmsTxtOptionsType;

/** One question and answer emitted as FAQ JSON-LD. */
export const FaqEntry = Schema.Struct({
  question: Schema.String,
  answer: Schema.String,
});

/** Static type inferred from {@link FaqEntry}. */
export type FaqEntryType = Schema.Schema.Type<typeof FaqEntry>;

/** Backward-compatible FAQ entry alias during the Schema migration. */
export type FaqEntry = FaqEntryType;

/** One internal-link target attached to a hub page. */
export const InternalLinkSpoke = Schema.Struct({
  path: Schema.String,
  anchor: Schema.String,
});

/** Static type inferred from {@link InternalLinkSpoke}. */
export type InternalLinkSpokeType = Schema.Schema.Type<typeof InternalLinkSpoke>;

/** Backward-compatible internal-link spoke alias during the Schema migration. */
export type InternalLinkSpoke = InternalLinkSpokeType;

/** One suggested link from a source page to a target page. */
export const InternalLinkSuggestion = Schema.Struct({
  fromPath: Schema.String,
  toPath: Schema.String,
  anchorText: Schema.String,
});

/** Static type inferred from {@link InternalLinkSuggestion}. */
export type InternalLinkSuggestionType = Schema.Schema.Type<typeof InternalLinkSuggestion>;

/** Backward-compatible internal-link suggestion alias during the Schema migration. */
export type InternalLinkSuggestion = InternalLinkSuggestionType;

const NextMetadataAlternates = Schema.Struct({
  canonical: Schema.String,
});

const NextOpenGraphOutput = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  url: Schema.String,
  type: PageType,
});

/** Next.js Metadata-compatible shape with no `next` import in this headless package. */
export const NextMetadataOutput = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  alternates: Schema.optional(NextMetadataAlternates),
  openGraph: Schema.optional(NextOpenGraphOutput),
});

/** Static type inferred from {@link NextMetadataOutput}. */
export type NextMetadataOutputType = Schema.Schema.Type<typeof NextMetadataOutput>;

/** Backward-compatible Next metadata output alias during the Schema migration. */
export type NextMetadataOutput = NextMetadataOutputType;

/** One URL emitted into a sitemap. */
export const SitemapEntry = Schema.Struct({
  url: Schema.String,
  lastModified: Schema.optional(Schema.String),
});

/** Static type inferred from {@link SitemapEntry}. */
export type SitemapEntryType = Schema.Schema.Type<typeof SitemapEntry>;

/** Backward-compatible sitemap entry alias during the Schema migration. */
export type SitemapEntry = SitemapEntryType;

/** Expected SEO provider failure. */
export class SeoError extends Data.TaggedError('SeoError')<{
  readonly code: 'SEO_CONFIG_INVALID' | 'SEO_PROVIDER_UNSUPPORTED';
  readonly message: string;
}> {}

/** SEO helper service exposed to templates and framework adapters. */
export type SeoService = {
  readonly name: SeoProviderNameType;
  readonly buildMetadata: (input: MetadataInputType) => MetadataOutputType;
  readonly buildOpenGraph: (input: MetadataInputType) => OpenGraphOutputType;
  readonly buildJsonLdBlogPosting: (input: MetadataInputType) => JsonLdBlockType;
  readonly buildJsonLdFaq: (entries: readonly FaqEntryType[]) => JsonLdBlockType;
  readonly buildLlmsTxt: (options: LlmsTxtOptionsType) => string;
  readonly suggestInternalLinks: (
    hubPath: string,
    spokes: readonly InternalLinkSpokeType[],
  ) => readonly InternalLinkSuggestionType[];
  readonly toNextMetadata: (
    meta: MetadataOutputType,
    og: OpenGraphOutputType,
  ) => NextMetadataOutputType;
  readonly sitemapEntries: (paths: readonly string[]) => readonly SitemapEntryType[];
  readonly robotsTxt: () => string;
  readonly verifyDelivery: () => Effect.Effect<true, SeoError>;
};

/** Backward-compatible provider alias while templates migrate to Effect Layer access. */
export type SeoProvider = SeoService;
