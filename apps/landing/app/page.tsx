import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { FeatureStrip } from '@/components/landing/FeatureStrip';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { LandingShell } from '@/components/landing/LandingShell';
import { PricingCTA } from '@/components/landing/PricingCTA';
import { ShowcaseCarousel } from '@/components/landing/ShowcaseCarousel';
import { ZigZagSection } from '@/components/landing/ZigZagSection';
import { faqJsonLd, productJsonLd } from '@/data/structuredData';

/** The home route is the canonical site root. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** VybeKiit cinematic store homepage — dark premium landing at `/`. */
const HomePage = () => (
  <LandingShell>
    <JsonLd data={[productJsonLd, faqJsonLd]} />
    <Header />
    <main>
      <Hero />
      <FeatureStrip />
      <ShowcaseCarousel />
      <ZigZagSection />
      <PricingCTA />
    </main>
    <Footer />
  </LandingShell>
);

export default HomePage;
