/**
 * Schema.org JSON-LD builders for the landing page — structured data that lets
 * search engines render rich results (Product price, FAQ accordion) and grounds
 * AI answer engines. Built from the same SSOT the UI renders, so the copy never forks.
 */
import { BRAND_FACTS, BRAND_SAME_AS } from '@/data/discoverability/brandFacts';
import { cdnAssetUrl } from '@/lib/cdnAssets';
import { FAQ } from './faq';
import { BRAND, PRICE } from './site';

/** A serializable Schema.org node, rendered inside `<script type="application/ld+json">`. */
export type JsonLdObject = Record<string, unknown>;

const logoUrl = cdnAssetUrl('/vybekiit-logo.svg');

/** Organization node — brand entity + sameAs for knowledge graph. */
export const organizationJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  legalName: BRAND_FACTS.legalName,
  url: BRAND.url,
  logo: logoUrl,
  description: BRAND.description,
  email: BRAND_FACTS.supportEmail,
  ...(BRAND_SAME_AS.length > 0 ? { sameAs: [...BRAND_SAME_AS] } : {}),
};

/** WebSite node — names the site for brand queries and sitelinks. */
export const websiteJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  url: BRAND.url,
  description: BRAND.description,
  publisher: {
    '@type': 'Organization',
    name: BRAND.name,
    url: BRAND.url,
  },
};

/** Product + Offer node — surfaces the one-time price as a rich result. */
export const productJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: BRAND.name,
  description: BRAND.description,
  brand: { '@type': 'Brand', name: BRAND.name },
  image: logoUrl,
  offers: {
    '@type': 'Offer',
    price: String(PRICE.amount),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: BRAND.url,
    priceValidUntil: '2027-12-31',
  },
};

/**
 * SoftwareApplication node — correct type for a downloadable/owned starter kit.
 * Complements Product for AI entity resolution.
 */
export const softwareApplicationJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: BRAND.name,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web, iOS, Android, Browser extension',
  description: BRAND.description,
  url: BRAND.url,
  image: logoUrl,
  offers: {
    '@type': 'Offer',
    price: String(PRICE.amount),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: BRAND.url,
  },
  author: {
    '@type': 'Organization',
    name: BRAND.name,
    url: BRAND.url,
  },
};

/** FAQPage node — GEO-weighted natural-language Q&A. */
export const faqJsonLd: JsonLdObject = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
};

/**
 * BreadcrumbList for a deep GEO page.
 *
 * @param crumbs - Ordered trail ending at the current page.
 * @returns JSON-LD BreadcrumbList.
 * @example
 * breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Compare', path: '/compare' }])
 */
export const breadcrumbJsonLd = (
  crumbs: readonly { readonly name: string; readonly path: string }[],
): JsonLdObject => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.path === '/' ? BRAND.url : `${BRAND.url}${crumb.path}`,
  })),
});
