import type { Result } from '@vybekiit/core';

export type SeoProviderName = 'local';

export type PageType = 'website' | 'article';

export interface MetadataInput {
  readonly title: string;
  readonly description?: string | undefined;
  readonly path?: string | undefined;
  readonly type?: PageType | undefined;
  readonly publishedAt?: string | undefined;
  readonly author?: string | undefined;
}

export interface MetadataOutput {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl?: string | undefined;
}

export interface OpenGraphOutput {
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly type: PageType;
}

/** Schema.org JSON-LD object — serializable for `<script type="application/ld+json">`. */
export type JsonLdBlock = Record<string, unknown>;

export interface LlmsTxtPage {
  readonly path: string;
  readonly title: string;
  readonly summary?: string | undefined;
}

export interface LlmsTxtOptions {
  readonly siteName: string;
  readonly siteDescription: string;
  readonly pages: readonly LlmsTxtPage[];
}

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export interface InternalLinkSpoke {
  readonly path: string;
  readonly anchor: string;
}

export interface InternalLinkSuggestion {
  readonly fromPath: string;
  readonly toPath: string;
  readonly anchorText: string;
}

/** Next.js Metadata-compatible shape — no `next` import in this headless package. */
export interface NextMetadataOutput {
  readonly title: string;
  readonly description: string;
  readonly alternates?: { readonly canonical: string };
  readonly openGraph?: {
    readonly title: string;
    readonly description: string;
    readonly url: string;
    readonly type: PageType;
  };
}

export interface SitemapEntry {
  readonly url: string;
  readonly lastModified?: string | undefined;
}

export interface SeoProvider {
  readonly name: SeoProviderName;
  buildMetadata(input: MetadataInput): MetadataOutput;
  buildOpenGraph(input: MetadataInput): OpenGraphOutput;
  buildJsonLdBlogPosting(input: MetadataInput): JsonLdBlock;
  buildJsonLdFaq(entries: readonly FaqEntry[]): JsonLdBlock;
  buildLlmsTxt(options: LlmsTxtOptions): string;
  suggestInternalLinks(
    hubPath: string,
    spokes: readonly InternalLinkSpoke[],
  ): readonly InternalLinkSuggestion[];
  toNextMetadata(meta: MetadataOutput, og: OpenGraphOutput): NextMetadataOutput;
  sitemapEntries(paths: readonly string[]): SitemapEntry[];
  robotsTxt(): string;
  verifyDelivery(): Promise<Result<true>>;
}
