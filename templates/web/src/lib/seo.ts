import type { MetadataInput, NextMetadataOutput, PageType } from '@vybekiit/seo';
import { createSeoFromEnv } from '@vybekiit/seo';
import type { Metadata } from 'next';
import { getCms } from './providers';

/** Resolve the SEO provider for metadata and GEO/AEO output. */
const getSeo = () => createSeoFromEnv();

/**
 * Convert kit SEO metadata into the shape expected by Next.js.
 *
 * @param output - Provider-generated metadata with optional alternates and Open Graph data.
 * @returns Metadata consumable by Next route exports.
 * @example
 * const metadata = toNextMetadata(output);
 */
const toNextMetadata = (output: NextMetadataOutput): Metadata => ({
  title: output.title,
  description: output.description,
  ...(output.alternates ? { alternates: output.alternates } : {}),
  ...(output.openGraph ? { openGraph: output.openGraph } : {}),
});

/**
 * Build generic page metadata through the configured SEO provider.
 *
 * @param input - Page title, path, type, and optional description.
 * @returns Metadata for a Next.js page export.
 * @example
 * const metadata = buildPageMetadata({ title: 'Pricing', path: '/pricing' });
 */
const buildPageMetadata = (input: {
  title: string;
  description?: string | undefined;
  path?: string | undefined;
  type?: PageType | undefined;
}): Metadata => {
  const seo = getSeo();
  const meta = seo.buildMetadata(input);
  const og = seo.buildOpenGraph(input);
  return toNextMetadata(seo.toNextMetadata(meta, og));
};

/**
 * Build metadata, JSON-LD, and page data for a blog route.
 *
 * @param slug - CMS slug without the `/blog/` prefix.
 * @returns Blog SEO payload, or `null` when the CMS has no page for the slug.
 * @example
 * const geo = await buildBlogGeo('hello-world');
 */
const buildBlogGeo = async (slug: string) => {
  const cms = getCms();
  const page = await cms.getPage(slug);
  if (!page) {
    return null;
  }

  const seo = getSeo();
  const description = page.description === undefined ? page.title : page.description;
  const input: MetadataInput = {
    title: page.title,
    description,
    path: `/blog/${slug}`,
    type: 'article',
  };
  const meta = seo.buildMetadata(input);
  const og = seo.buildOpenGraph(input);

  return {
    metadata: toNextMetadata(seo.toNextMetadata(meta, og)),
    jsonLd: seo.buildJsonLdBlogPosting(input),
    page,
  };
};

export { buildBlogGeo, buildPageMetadata, getSeo, toNextMetadata };
