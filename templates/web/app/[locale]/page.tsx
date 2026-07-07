import { MarketingShell } from '@/components/marketing-shell';
import { MarketingHero } from '@/components/marketing-hero';
import { HomeFeatureGrid } from '@/components/home-feature-grid';
import { setRequestLocale } from 'next-intl/server';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Landing page — normalized hero block + feature grid + CTA. The agent reshapes
 * copy and blocks to the builder's idea; spacing mirrors in RTL.
 *
 * @param props - Locale route params from Next.js.
 * @returns The localized marketing home page.
 * @example
 * <HomePage params={params} />
 */
const HomePage = async ({ params }: HomePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <MarketingShell>
      <MarketingHero />
      <HomeFeatureGrid />
    </MarketingShell>
  );
};

export default HomePage;
