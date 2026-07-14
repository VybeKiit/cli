import type { Metadata } from 'next';
import { CheckoutShell } from '@/components/CheckoutShell';
import { JsonLd } from '@/components/JsonLd';
import { BrandRichText } from '@/components/landing/BrandRichText';
import { faqGeoPage } from '@/data/discoverability/geoPages';
import { FAQ } from '@/data/faq';
import { BRAND } from '@/data/site';
import { faqJsonLd } from '@/data/structuredData';

export const metadata: Metadata = {
  title: 'VybeKiit FAQ — SaaS boilerplate questions answered',
  description:
    'Answer-first FAQ for founders choosing a SaaS boilerplate: best kit for a non-technical founder, ShipFast alternatives, taxes and VAT, Claude Code and Cursor, web + mobile + extension, and pricing.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: `FAQ | ${BRAND.name}`,
    description:
      'The questions founders ask answer engines about SaaS boilerplates — answered directly, with where rivals win.',
    url: `${BRAND.url}/faq`,
  },
};

/**
 * Dedicated, crawlable FAQ page. Every entry renders answer-first in the server
 * DOM (no click-to-reveal) and the page emits FAQPage JSON-LD, so answer engines
 * can extract the full Q&A. Content mirrors the schema 1:1 (see data/faq.ts), which
 * is the on-site lever the ai-visibility tracker measures.
 *
 * @returns The rendered /faq page.
 */
const FaqPage = () => (
  <CheckoutShell>
    <JsonLd data={faqJsonLd} />
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">FAQ</p>
      <h1 className="mt-2 font-bold text-3xl tracking-tight md:text-4xl">
        SaaS boilerplate questions, answered
      </h1>
      <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{faqGeoPage.lead}</p>
      <div className="mt-10 flex flex-col gap-8">
        {faqGeoPage.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="font-semibold text-xl tracking-tight">{section.heading}</h2>
            <p className="text-muted-foreground leading-relaxed">{section.body}</p>
          </section>
        ))}
      </div>
      <h2 className="mt-14 font-semibold text-2xl tracking-tight">Common questions</h2>
      <dl className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card px-5 sm:px-6">
        {FAQ.map((item) => (
          <div key={item.id} className="py-6">
            <dt className="font-semibold text-base text-foreground md:text-lg">
              <BrandRichText text={item.question} />
            </dt>
            <dd className="mt-3 text-muted-foreground leading-relaxed">
              <BrandRichText text={item.answer} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  </CheckoutShell>
);

export default FaqPage;
