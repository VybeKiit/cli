import { MarketingShell } from '@/components/marketing-shell';
import { VybeJsonLd } from '@/components/vybe-json-ld';
import { Link } from '@/i18n/navigation';
import { buildBlogGeo } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type BlogPostProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const geo = await buildBlogGeo(slug);
  if (!geo) return { title: 'Not found' };
  return geo.metadata;
}

/** Single blog post with JSON-LD for answer engines — skill: add-blog */
export default async function BlogPostPage({ params }: BlogPostProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const geo = await buildBlogGeo(slug);
  if (!geo) notFound();

  return (
    <MarketingShell>
      <VybeJsonLd data={geo.jsonLd} />
      <article className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">
          <Link href="/blog" className="hover:underline">
            Back to blog
          </Link>
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{geo.page.title}</h1>
        {geo.page.description ? (
          <p className="mt-2 text-lg text-muted-foreground">{geo.page.description}</p>
        ) : null}
        {geo.page.body ? (
          <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
            <pre className="whitespace-pre-wrap font-sans text-base">{geo.page.body}</pre>
          </div>
        ) : null}
      </article>
    </MarketingShell>
  );
}
