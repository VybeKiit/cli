import type { MetadataInput, NextMetadataOutput, PageType } from '@vybekiit/seo';
import { createSeoFromEnv } from '@vybekiit/seo';
import type { Metadata } from 'next';
import { getCms } from './providers';

/** SEO + GEO wire point — skills: add-blog, go-live */
export function getSeo() {
  return createSeoFromEnv();
}

export function toNextMetadata(output: NextMetadataOutput): Metadata {
  return {
    title: output.title,
    description: output.description,
    ...(output.alternates ? { alternates: output.alternates } : {}),
    ...(output.openGraph ? { openGraph: output.openGraph } : {}),
  };
}

export function buildPageMetadata(input: {
  title: string;
  description?: string | undefined;
  path?: string | undefined;
  type?: PageType | undefined;
}): Metadata {
  const seo = getSeo();
  const meta = seo.buildMetadata(input);
  const og = seo.buildOpenGraph(input);
  return toNextMetadata(seo.toNextMetadata(meta, og));
}

export async function buildBlogGeo(slug: string) {
  const cms = getCms();
  const page = await cms.getPage(slug);
  if (!page) {
    return null;
  }

  const seo = getSeo();
  const input: MetadataInput = {
    title: page.title,
    description: page.description ?? page.title,
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
}
