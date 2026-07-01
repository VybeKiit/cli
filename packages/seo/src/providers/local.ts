import { type AppConfig, appConfigSchema, type SeoConfig, ok } from '@vybekiit/core';
import type {
  FaqEntry,
  InternalLinkSpoke,
  InternalLinkSuggestion,
  JsonLdBlock,
  LlmsTxtOptions,
  MetadataInput,
  MetadataOutput,
  NextMetadataOutput,
  OpenGraphOutput,
  SeoProvider,
  SitemapEntry,
} from '../types';

function resolvePath(base: string, path?: string | undefined): string {
  const normalized = path?.startsWith('/') ? path : `/${path ?? ''}`;
  return normalized === '/' ? base : `${base}${normalized}`;
}

function buildCanonical(base: string, input: MetadataInput): string {
  return resolvePath(base, input.path);
}

export function createLocalSeo(app: AppConfig, _config: SeoConfig): SeoProvider {
  // drop a trailing slash from the base URL: "https://x.com/" → "https://x.com"
  const base = app.APP_URL.replace(/\/$/, '');

  return {
    name: 'local',

    buildMetadata(input: MetadataInput): MetadataOutput {
      return {
        title: input.title,
        description: input.description ?? input.title,
        canonicalUrl: buildCanonical(base, input),
      };
    },

    buildOpenGraph(input: MetadataInput): OpenGraphOutput {
      const meta = this.buildMetadata(input);
      return {
        title: meta.title,
        description: meta.description,
        url: meta.canonicalUrl ?? base,
        type: input.type ?? 'website',
      };
    },

    buildJsonLdBlogPosting(input: MetadataInput): JsonLdBlock {
      const url = buildCanonical(base, input);
      const block: JsonLdBlock = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: input.title,
        description: input.description ?? input.title,
        url,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      };
      if (input.publishedAt) block.datePublished = input.publishedAt;
      if (input.author) {
        block.author = { '@type': 'Person', name: input.author };
      }
      return block;
    },

    buildJsonLdFaq(entries: readonly FaqEntry[]): JsonLdBlock {
      return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entries.map((entry) => ({
          '@type': 'Question',
          name: entry.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: entry.answer,
          },
        })),
      };
    },

    buildLlmsTxt(options: LlmsTxtOptions): string {
      const lines = [`# ${options.siteName}`, '', options.siteDescription, '', '## Pages', ''];
      for (const page of options.pages) {
        const path = page.path.startsWith('/') ? page.path : `/${page.path}`;
        const url = path.startsWith('http') ? path : `${base}${path}`;
        lines.push(`- [${page.title}](${url})`);
        if (page.summary) lines.push(`  ${page.summary}`);
      }
      lines.push('', `Full documentation: ${base}/llms-full.txt`);
      return lines.join('\n');
    },

    suggestInternalLinks(
      hubPath: string,
      spokes: readonly InternalLinkSpoke[],
    ): readonly InternalLinkSuggestion[] {
      const hub = hubPath.startsWith('/') ? hubPath : `/${hubPath}`;
      const links: InternalLinkSuggestion[] = [];
      for (const spoke of spokes) {
        const spokePath = spoke.path.startsWith('/') ? spoke.path : `/${spoke.path}`;
        links.push({
          fromPath: hub,
          toPath: spokePath,
          anchorText: spoke.anchor,
        });
        links.push({
          fromPath: spokePath,
          toPath: hub,
          anchorText: 'Back to overview',
        });
      }
      return links;
    },

    toNextMetadata(meta: MetadataOutput, og: OpenGraphOutput): NextMetadataOutput {
      return {
        title: meta.title,
        description: meta.description,
        ...(meta.canonicalUrl ? { alternates: { canonical: meta.canonicalUrl } } : {}),
        openGraph: {
          title: og.title,
          description: og.description,
          url: og.url,
          type: og.type,
        },
      };
    },

    sitemapEntries(paths: readonly string[]): SitemapEntry[] {
      return paths.map((path) => {
        if (path.startsWith('http')) return { url: path };
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return { url: `${base}${normalized}` };
      });
    },

    robotsTxt(): string {
      return `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;
    },

    async verifyDelivery() {
      return ok(true);
    },
  };
}
