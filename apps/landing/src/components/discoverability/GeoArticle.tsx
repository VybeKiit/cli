import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import type { GeoPageContent } from '@/data/discoverability/geoPages';
import { PRICE } from '@/data/site';
import { breadcrumbJsonLd } from '@/data/structuredData';

interface GeoArticleProps {
  readonly page: GeoPageContent;
}

/**
 * Server-rendered GEO article: answer-first lead, sections, related links, CTA.
 *
 * @param props - Page content from the discoverability SSOT.
 * @returns The rendered article.
 * @example
 * <GeoArticle page={findGeoPage('/shipfast-alternative')!} />
 */
export const GeoArticle = ({ page }: GeoArticleProps) => (
  <article className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:py-20">
    <JsonLd
      data={breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Compare', path: '/compare' },
        { name: page.title, path: page.path },
      ])}
    />
    <header className="flex flex-col gap-4 border-border/60 border-b pb-8">
      <p className="text-muted-foreground text-sm">
        <Link className="underline-offset-4 hover:underline" href="/compare">
          SaaS boilerplate comparison
        </Link>
        <span aria-hidden={true}> · </span>
        <Link className="underline-offset-4 hover:underline" href="/">
          Home
        </Link>
      </p>
      <h1 className="text-balance font-bold text-3xl tracking-tight sm:text-4xl">{page.title}</h1>
      <p className="text-lg text-muted-foreground leading-relaxed">{page.lead}</p>
      <p className="text-muted-foreground text-sm">
        Matrix prices and rival notes last verified 2026-06-27. Re-check live rival pricing before
        purchase decisions.
      </p>
    </header>

    {page.sections.map((section) => (
      <section key={section.heading} className="flex flex-col gap-2">
        <h2 className="font-semibold text-xl tracking-tight">{section.heading}</h2>
        <p className="text-muted-foreground leading-relaxed">{section.body}</p>
      </section>
    ))}

    {page.rivalOfficialUrl !== undefined && page.rivalOfficialLabel !== undefined ? (
      <p className="text-muted-foreground text-sm">
        Official rival site:{' '}
        <a
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={page.rivalOfficialUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {page.rivalOfficialLabel}
        </a>
      </p>
    ) : null}

    <section className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 p-6">
      <h2 className="font-semibold text-lg tracking-tight">Get the agent-ready base</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        VybeKiit is {PRICE.display} one-time for web + mobile + extension foundations with agent
        instructions. {PRICE.refundDays}-day refund per terms.
      </p>
      <Link
        className="inline-flex w-fit items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-opacity hover:opacity-90"
        href="/#pricing"
      >
        Get VybeKiit
      </Link>
    </section>

    <nav aria-label="Related pages" className="flex flex-col gap-2">
      <h2 className="font-semibold text-lg tracking-tight">Related</h2>
      <ul className="list-inside list-disc text-muted-foreground text-sm">
        {page.related.map((link) => (
          <li key={link.href}>
            <Link className="text-primary underline-offset-4 hover:underline" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </article>
);
