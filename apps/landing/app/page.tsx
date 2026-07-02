import { FaqSection } from '@/components/landing/FaqSection';
import { FeatureStrip } from '@/components/landing/FeatureStrip';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { LandingShell } from '@/components/landing/LandingShell';
import { PricingCTA } from '@/components/landing/PricingCTA';
import { ShowcaseCarousel } from '@/components/landing/ShowcaseCarousel';
import { ZigZagSection } from '@/components/landing/ZigZagSection';

/** VybeKiit cinematic store homepage — dark premium landing at `/`. */
export default function HomePage() {
  return (
    <LandingShell>
      <Header />
      <main>
        <Hero />
        <FeatureStrip />
        <ShowcaseCarousel />
        <ZigZagSection />
        <FaqSection />
        <PricingCTA />
      </main>
      <Footer />
    </LandingShell>
  );
}
