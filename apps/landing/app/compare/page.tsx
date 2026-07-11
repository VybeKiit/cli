import type { Metadata } from 'next';
import { CheckoutShell } from '@/components/CheckoutShell';
import { CompareHub } from '@/components/discoverability/CompareHub';
import { JsonLd } from '@/components/JsonLd';
import { BRAND } from '@/data/site';
import { faqJsonLd } from '@/data/structuredData';

export const metadata: Metadata = {
  title: 'SaaS boilerplate comparison 2026',
  description:
    'Compare SaaS starter kits by use case: agent-operated vs developer-first, platforms, Merchant of Record, price. Quick pick + matrix verified 2026-06-27.',
  alternates: { canonical: '/compare' },
  openGraph: {
    title: `SaaS boilerplate comparison | ${BRAND.name}`,
    description:
      'Honest SaaS boilerplate matrix and quick-pick by use case. Where ShipFast, MakerKit, Open SaaS, and VybeKiit each win.',
    url: `${BRAND.url}/compare`,
  },
};

/**
 * Pillar comparison hub for SEO/GEO citations.
 *
 * @returns The rendered /compare page.
 */
const ComparePage = () => (
  <CheckoutShell>
    <JsonLd data={faqJsonLd} />
    <CompareHub />
  </CheckoutShell>
);

export default ComparePage;
