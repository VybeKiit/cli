/**
 * Schema.org JSON-LD builders for the landing page — structured data that lets
 * search engines render rich results (Product price, FAQ accordion) and grounds
 * AI answer engines. Built from the same SSOT the UI renders, so the copy never forks.
 */
import { FAQ } from './faq';
import { BRAND, PRICE } from './site';

/** A serializable Schema.org node, rendered inside `<script type="application/ld+json">`. */
export type JsonLdObject = Record<string, unknown>;

/** Organization node — identifies the brand and its logo to search engines. */
export const organizationJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  url: BRAND.url,
  logo: `${BRAND.url}/vybekiit-logo.svg`,
  description: BRAND.description,
};

/** WebSite node — names the site for brand queries and sitelinks. */
export const websiteJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  url: BRAND.url,
};

/** Product + Offer node — surfaces the one-time price as a rich result. */
export const productJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: BRAND.name,
  description: BRAND.description,
  brand: { '@type': 'Brand', name: BRAND.name },
  offers: {
    '@type': 'Offer',
    price: String(PRICE.amount),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: BRAND.url,
  },
};

/** FAQPage node — the shipped FAQ set, so search engines can show the accordion result. */
export const faqJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};
