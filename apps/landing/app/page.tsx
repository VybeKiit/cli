import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { JsonLd } from '@/components/JsonLd';
import { MarketingShell } from '@/components/MarketingShell';
import { Hero } from '@/components/sections/hero';
import { faqJsonLd, productJsonLd } from '@/data/structuredData';

/**
 * Below-fold marketing sections — code-split so the mobile critical path only
 * pays for the hero first. Each chunk still SSRs for SEO/CLS stability.
 */
const TechTrustStrip = dynamic(() =>
  import('@/components/sections/TechTrustStrip').then((m) => m.TechTrustStrip),
);
const OperatorSteps = dynamic(() =>
  import('@/components/sections/OperatorSteps').then((m) => m.OperatorSteps),
);
const ProblemSolution = dynamic(() =>
  import('@/components/sections/ProblemSolution').then((m) => m.ProblemSolution),
);
const PlatformsBundle = dynamic(() =>
  import('@/components/sections/PlatformsBundle').then((m) => m.PlatformsBundle),
);
const PageRecipesCarousel = dynamic(() =>
  import('@/components/sections/PageRecipesCarousel').then((m) => m.PageRecipesCarousel),
);
const Comparison = dynamic(() =>
  import('@/components/sections/comparison').then((m) => m.Comparison),
);
const Pricing = dynamic(() => import('@/components/sections/pricing').then((m) => m.Pricing));
const Faq = dynamic(() => import('@/components/sections/faq').then((m) => m.Faq));

/** The home route is the canonical site root. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * VybeKiit visitor marketing homepage — light storefront matching the approved mock.
 * Hero is eager; everything below folds into async chunks for mobile LCP/TBT.
 *
 * @returns The rendered home page.
 */
const HomePage = () => (
  <MarketingShell>
    <JsonLd data={[productJsonLd, faqJsonLd]} />
    <Hero />
    <TechTrustStrip />
    <OperatorSteps />
    <ProblemSolution />
    <PlatformsBundle />
    <PageRecipesCarousel />
    <Comparison />
    <Pricing />
    <Faq />
  </MarketingShell>
);

export default HomePage;
