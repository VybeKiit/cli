import { MarketingShell } from '@/components/marketing-shell';
import { MarketingHero } from '@/components/marketing-hero';
import { HomeFeatureGrid } from '@/components/home-feature-grid';
import { setRequestLocale } from 'next-intl/server';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

/**
 * Landing page — normalized hero block + feature grid + CTA. The agent reshapes
 * copy and blocks to the builder's idea; spacing mirrors in RTL.
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <MarketingShell>
      <MarketingHero />
      <HomeFeatureGrid />
    </MarketingShell>
  );
}
