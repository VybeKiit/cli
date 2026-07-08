import { MarketingShell } from '@/components/marketing-shell';
import { Card, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { getCms } from '@/lib/providers';
import { buildPageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

interface BlogIndexProps {
  params: Promise<{ locale: string }>;
}

/**
 * Build the metadata for the localized blog index page.
 *
 * @returns The metadata consumed by Next.js for the blog index route.
 * @example
 * const metadata = generateMetadata();
 */
const generateMetadata = (): Metadata =>
  buildPageMetadata({
    title: 'Blog',
    description: 'Updates and articles',
    path: '/blog',
  });

/**
 * Render the blog index hub for hub-spoke internal links.
 *
 * @param props - Locale route params from Next.js.
 * @returns The localized blog index page.
 * @example
 * <BlogIndexPage params={params} />
 */
const BlogIndexPage = async ({ params }: BlogIndexProps) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const cms = getCms();
  const pages = await cms.listPages();

  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-semibold text-3xl tracking-tight">Blog</h1>
        <p className="mt-2 text-muted-foreground">News and updates from the team.</p>
        <ul className="mt-8 space-y-4">
          {pages.map((page) => (
            <li key={page.slug}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Link href={`/blog/${page.slug}`} className="hover:underline">
                      {page.title}
                    </Link>
                  </CardTitle>
                  {page.description ? <CardDescription>{page.description}</CardDescription> : null}
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </MarketingShell>
  );
};

export { generateMetadata };
export default BlogIndexPage;
