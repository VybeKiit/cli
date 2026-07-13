import { DownloadCta } from '@/components/sections/DownloadCta';
import { Faq } from '@/components/sections/Faq';
import { FeatureGrid } from '@/components/sections/FeatureGrid';
import { Hero } from '@/components/sections/Hero';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { SiteHeader } from '@/components/sections/SiteHeader';
import { Testimonials } from '@/components/sections/Testimonials';

/**
 * Mobile-app landing page — composes the marketing sections top to bottom to match
 * the approved reference design.
 *
 * @returns The rendered landing page.
 * @example
 * // Rendered by Next.js at the site root.
 */
const HomePage = () => (
  <>
    <SiteHeader />
    <main>
      <Hero />
      <FeatureGrid />
      <Testimonials />
      <Faq />
      <DownloadCta />
    </main>
    <SiteFooter />
  </>
);

export default HomePage;
