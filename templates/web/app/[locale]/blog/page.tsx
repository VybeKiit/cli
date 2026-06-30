import { MarketingShell } from '@/components/marketing-shell';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCms } from '@/lib/providers';
import { buildPageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

type BlogIndexProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Blog',
    description: 'Updates and articles',
    path: '/blog',
  });
}

/** Blog index — hub for hub-spoke internal links (GEO). */
export default async function BlogIndexPage({ params }: BlogIndexProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cms = getCms();
  const pages = await cms.listPages();

  return (
    <MarketingShell>
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
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
}
