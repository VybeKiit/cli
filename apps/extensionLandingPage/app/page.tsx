import { Faq } from '@/components/sections/Faq';
import { FeatureBadges } from '@/components/sections/FeatureBadges';
import { FeatureGrid } from '@/components/sections/FeatureGrid';
import { Hero } from '@/components/sections/Hero';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { ReadyCta } from '@/components/sections/ReadyCta';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { TrustedStats } from '@/components/sections/TrustedStats';

/**
 * The ExtenName browser-extension landing page — composes every section in the
 * reference order under a sticky header and a mapped footer.
 *
 * @returns The rendered landing page.
 * @example
 * // Rendered by Next.js as the site root route.
 */
const HomePage = () => (
  <>
    <SiteHeader />
    <main>
      <Hero />
      <FeatureBadges />
      <HowItWorks />
      <FeatureGrid />
      <TrustedStats />
      <Faq />
      <ReadyCta />
    </main>
    <SiteFooter />
  </>
);

export default HomePage;
