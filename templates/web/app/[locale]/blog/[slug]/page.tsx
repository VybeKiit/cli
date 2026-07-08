import { MarketingShell } from '@/components/marketing-shell';
import { VybeJsonLd } from '@/components/vybe-json-ld';
import { Link } from '@/i18n/navigation';
import { buildBlogGeo } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

interface BlogPostProps {
  params: Promise<{ locale: string; slug: string }>;
}

/**
 * Build metadata for one blog post.
 *
 * @param props - Locale and slug route params from Next.js.
 * @returns Blog metadata or a not-found title.
 * @example
 * const metadata = await generateMetadata({ params });
 */
const generateMetadata = async ({ params }: BlogPostProps): Promise<Metadata> => {
  const { slug } = await params;
  const geo = await buildBlogGeo(slug);
  if (!geo) {
    return { title: 'Not found' };
  }
  return geo.metadata;
};

/**
 * Render one blog post with JSON-LD for answer engines.
 *
 * @param props - Locale and slug route params from Next.js.
 * @returns The localized blog post page.
 * @example
 * <BlogPostPage params={params} />
 */
const BlogPostPage = async ({ params }: BlogPostProps) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const geo = await buildBlogGeo(slug);
  if (!geo) {
    notFound();
  }

  return (
    <MarketingShell>
      <VybeJsonLd data={geo.jsonLd} />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-muted-foreground text-sm">
          <Link href="/blog" className="hover:underline">
            Back to blog
          </Link>
        </p>
        <h1 className="mt-4 font-semibold text-3xl tracking-tight">{geo.page.title}</h1>
        {geo.page.description ? (
          <p className="mt-2 text-lg text-muted-foreground">{geo.page.description}</p>
        ) : null}
        {geo.page.body ? (
          <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-base">{geo.page.body}</pre>
          </div>
        ) : null}
      </article>
    </MarketingShell>
  );
};

export { generateMetadata };
export default BlogPostPage;
