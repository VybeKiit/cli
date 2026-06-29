import { MarketingShell } from '@/components/marketing-shell';
import { MarketingHero } from '@/components/marketing-hero';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HOME_FEATURES } from '@/data/marketing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

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
  const t = await getTranslations();

  return (
    <MarketingShell>
      <MarketingHero />
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {HOME_FEATURES.map((feature) => (
          <Card key={feature.titleKey}>
            <CardHeader>
              <CardTitle className="text-base">{t(feature.titleKey)}</CardTitle>
              <CardDescription>{t(feature.bodyKey)}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </MarketingShell>
  );
}
