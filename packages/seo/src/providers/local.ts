import type { SeoAppConfigType, SeoConfig } from '@vybekiit/seo/config';
import type {
  InternalLinkSuggestion,
  MetadataInput,
  MetadataOutput,
  OpenGraphOutput,
  SeoProvider,
} from '@vybekiit/seo/types';
import { Effect } from 'effect';

const overviewAnchorText = 'Back to overview';

/**
 * Remove a trailing slash from the configured app URL.
 *
 * @param url - App URL from validated config.
 * @returns The app URL without a trailing slash.
 * @example
 * resolveBaseUrl('https://example.com/') === 'https://example.com';
 */
const resolveBaseUrl = (url: string): string => {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  }
  return url;
};

/**
 * Normalize an optional path into a site-relative path.
 *
 * @param path - Optional page path from metadata input.
 * @returns A path that starts with `/`.
 * @example
 * normalizePath('blog') === '/blog';
 */
const normalizePath = (path: string | undefined): string => {
  if (path === undefined || path === '') {
    return '/';
  }
  if (path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
};

/**
 * Resolve a site-relative path against the app base URL.
 *
 * @param base - App base URL without a trailing slash.
 * @param path - Optional page path to append.
 * @returns The canonical absolute URL for the path.
 * @example
 * resolvePath('https://example.com', '/blog') === 'https://example.com/blog';
 */
const resolvePath = (base: string, path: string | undefined): string => {
  const normalized = normalizePath(path);
  if (normalized === '/') {
    return base;
  }
  return `${base}${normalized}`;
};

/**
 * Build the canonical URL for a metadata input.
 *
 * @param base - App base URL without a trailing slash.
 * @param input - Page metadata input.
 * @returns The canonical URL for the page.
 * @example
 * buildCanonical('https://example.com', { title: 'Home' }) === 'https://example.com';
 */
const buildCanonical = (base: string, input: MetadataInput): string =>
  resolvePath(base, input.path);

/**
 * Resolve the page description used by metadata outputs.
 *
 * @param input - Page metadata input.
 * @returns The explicit description, or the title when no description was supplied.
 * @example
 * resolveDescription({ title: 'Home' }) === 'Home';
 */
const resolveDescription = (input: MetadataInput): string => {
  if (input.description !== undefined) {
    return input.description;
  }
  return input.title;
};

/**
 * Resolve the Open Graph page type.
 *
 * @param input - Page metadata input.
 * @returns The explicit type, or `website` for ordinary pages.
 * @example
 * resolvePageType({ title: 'Home' }) === 'website';
 */
const resolvePageType = (input: MetadataInput): OpenGraphOutput['type'] => {
  if (input.type !== undefined) {
    return input.type;
  }
  return 'website';
};

/**
 * Resolve a canonical URL from metadata output.
 *
 * @param meta - Metadata output from `buildMetadata`.
 * @param base - App base URL without a trailing slash.
 * @returns The canonical URL, or the app base when absent.
 * @example
 * resolveMetadataUrl({ title: 'T', description: 'D' }, 'https://example.com') === 'https://example.com';
 */
const resolveMetadataUrl = (meta: MetadataOutput, base: string): string => {
  if (meta.canonicalUrl !== undefined) {
    return meta.canonicalUrl;
  }
  return base;
};

/**
 * Convert a page path into an absolute URL.
 *
 * @param base - App base URL without a trailing slash.
 * @param path - Absolute or site-relative path.
 * @returns The absolute URL for the page.
 * @example
 * resolvePageUrl('https://example.com', '/blog') === 'https://example.com/blog';
 */
const resolvePageUrl = (base: string, path: string): string => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${base}${normalizePath(path)}`;
};

/**
 * Create the metadata builder for a base URL.
 *
 * @param base - App base URL without a trailing slash.
 * @returns A metadata builder bound to the app base URL.
 * @example
 * const buildMetadata = createMetadataBuilder('https://example.com');
 */
const createMetadataBuilder =
  (base: string): SeoProvider['buildMetadata'] =>
  (input) => ({
    title: input.title,
    description: resolveDescription(input),
    canonicalUrl: buildCanonical(base, input),
  });

/**
 * Create the Open Graph builder for a base URL.
 *
 * @param base - App base URL without a trailing slash.
 * @param buildMetadata - Metadata builder used as the canonical source.
 * @returns An Open Graph builder bound to the app base URL.
 * @example
 * const buildOpenGraph = createOpenGraphBuilder(base, buildMetadata);
 */
const createOpenGraphBuilder =
  (base: string, buildMetadata: SeoProvider['buildMetadata']): SeoProvider['buildOpenGraph'] =>
  (input) => {
    const meta = buildMetadata(input);
    return {
      title: meta.title,
      description: meta.description,
      url: resolveMetadataUrl(meta, base),
      type: resolvePageType(input),
    };
  };

/**
 * Create the BlogPosting JSON-LD builder for a base URL.
 *
 * @param base - App base URL without a trailing slash.
 * @returns A BlogPosting JSON-LD builder bound to the app base URL.
 * @example
 * const buildPost = createBlogPostingBuilder('https://example.com');
 */
const createBlogPostingBuilder =
  (base: string): SeoProvider['buildJsonLdBlogPosting'] =>
  (input) => {
    const url = buildCanonical(base, input);
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: input.title,
      description: resolveDescription(input),
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      ...(input.publishedAt === undefined ? {} : { datePublished: input.publishedAt }),
      ...(input.author === undefined ? {} : { author: { '@type': 'Person', name: input.author } }),
    };
  };

/**
 * Build Schema.org FAQPage JSON-LD.
 *
 * @param entries - Question and answer pairs for the page.
 * @returns A serializable FAQPage JSON-LD block.
 * @example
 * buildJsonLdFaq([{ question: 'What?', answer: 'This.' }]);
 */
const buildJsonLdFaq: SeoProvider['buildJsonLdFaq'] = (entries) => ({
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
});

/**
 * Create the `llms.txt` builder for a base URL.
 *
 * @param base - App base URL without a trailing slash.
 * @returns An `llms.txt` builder bound to the app base URL.
 * @example
 * const buildLlmsTxt = createLlmsTxtBuilder('https://example.com');
 */
const createLlmsTxtBuilder =
  (base: string): SeoProvider['buildLlmsTxt'] =>
  (options) => {
    const lines = [`# ${options.siteName}`, '', options.siteDescription, '', '## Pages', ''];
    for (const page of options.pages) {
      const url = resolvePageUrl(base, page.path);
      lines.push(`- [${page.title}](${url})`);
      if (page.summary !== undefined) {
        lines.push(`  ${page.summary}`);
      }
    }
    lines.push('', `Full documentation: ${base}/llms-full.txt`);
    return lines.join('\n');
  };

/**
 * Suggest reciprocal internal links for a hub page and spokes.
 *
 * @param hubPath - Hub page path.
 * @param spokes - Spoke pages linked from the hub.
 * @returns Suggested links in both hub-to-spoke and spoke-to-hub directions.
 * @example
 * suggestInternalLinks('/blog', [{ path: '/blog/a', anchor: 'A' }]);
 */
const suggestInternalLinks: SeoProvider['suggestInternalLinks'] = (hubPath, spokes) => {
  const hub = normalizePath(hubPath);
  const links: InternalLinkSuggestion[] = [];
  for (const spoke of spokes) {
    const spokePath = normalizePath(spoke.path);
    links.push({
      fromPath: hub,
      toPath: spokePath,
      anchorText: spoke.anchor,
    });
    links.push({
      fromPath: spokePath,
      toPath: hub,
      anchorText: overviewAnchorText,
    });
  }
  return links;
};

/**
 * Convert headless SEO metadata into Next.js-compatible metadata.
 *
 * @param meta - Canonical metadata output.
 * @param og - Open Graph metadata output.
 * @returns A Next.js metadata-compatible object.
 * @example
 * toNextMetadata(meta, og);
 */
const toNextMetadata: SeoProvider['toNextMetadata'] = (meta, og) => ({
  title: meta.title,
  description: meta.description,
  ...(meta.canonicalUrl === undefined ? {} : { alternates: { canonical: meta.canonicalUrl } }),
  openGraph: {
    title: og.title,
    description: og.description,
    url: og.url,
    type: og.type,
  },
});

/**
 * Create the sitemap-entry builder for a base URL.
 *
 * @param base - App base URL without a trailing slash.
 * @returns A sitemap-entry builder bound to the app base URL.
 * @example
 * const sitemapEntries = createSitemapEntryBuilder('https://example.com');
 */
const createSitemapEntryBuilder =
  (base: string): SeoProvider['sitemapEntries'] =>
  (paths) =>
    paths.map((path) => ({ url: resolvePageUrl(base, path) }));

/**
 * Create the robots.txt builder for a base URL.
 *
 * @param base - App base URL without a trailing slash.
 * @returns A robots.txt builder bound to the app base URL.
 * @example
 * const robotsTxt = createRobotsTxtBuilder('https://example.com');
 */
const createRobotsTxtBuilder =
  (base: string): SeoProvider['robotsTxt'] =>
  () =>
    `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;

/**
 * Verify the local SEO delivery path.
 *
 * @returns An Effect that succeeds when local SEO helpers are available.
 * @example
 * const verification = verifyDelivery();
 */
const verifyDelivery: SeoProvider['verifyDelivery'] = () => Effect.succeed(true as const);

/**
 * Build the local SEO helper implementation.
 *
 * @param app - Validated app config containing the base URL.
 * @param _config - Validated SEO config, reserved for future local options.
 * @returns A provider that derives SEO metadata without external services.
 * @example
 * const seo = createLocalSeo(appConfig, { SEO_PROVIDER: 'local' });
 */
export const createLocalSeo = (app: SeoAppConfigType, _config: SeoConfig): SeoProvider => {
  const base = resolveBaseUrl(app.APP_URL);
  const buildMetadata = createMetadataBuilder(base);

  return {
    name: 'local',
    buildMetadata,
    buildOpenGraph: createOpenGraphBuilder(base, buildMetadata),
    buildJsonLdBlogPosting: createBlogPostingBuilder(base),
    buildJsonLdFaq,
    buildLlmsTxt: createLlmsTxtBuilder(base),
    suggestInternalLinks,
    toNextMetadata,
    sitemapEntries: createSitemapEntryBuilder(base),
    robotsTxt: createRobotsTxtBuilder(base),
    verifyDelivery,
  };
};
