'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent } from '@vybekiit/ui/card';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/**
 * Render the localized marketing hero.
 *
 * @returns The public home-page hero section.
 * @example
 * <MarketingHero />
 */
const MarketingHero = () => {
  const t = useTranslations();

  return (
    <section className="relative mx-auto max-w-5xl px-6 py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-muted/40 blur-2xl" />
      <Card className="overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-start gap-6 p-8 md:p-12">
          <Badge variant="secondary">{t('home.hero.badge')}</Badge>
          <h1 className="text-balance font-bold text-4xl tracking-tight md:text-5xl">
            {t('home.hero.title')}
          </h1>
          <p className="max-w-2xl text-balance text-lg text-muted-foreground">
            {t('home.hero.description')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild={true} size="lg">
              <Link href="/signup">{t('home.hero.cta.getStarted')}</Link>
            </Button>
            <Button asChild={true} size="lg" variant="outline">
              <Link href="/pricing">{t('home.hero.cta.seePricing')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export { MarketingHero };
