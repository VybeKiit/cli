'use client';

import { BuilderFeatureHint } from '@/components/builder-feature-hint';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HOME_FEATURES, type HomeFeatureIcon } from '@/data/marketing';
import { BellRing, ChartLine, CircleHelp, Cloud, CreditCard, Database } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentType } from 'react';

const FEATURE_ICONS: Record<HomeFeatureIcon, ComponentType<{ className?: string }>> = {
  payments: CreditCard,
  data: Database,
  deploy: Cloud,
  stats: ChartLine,
  alerts: BellRing,
};

/**
 * Landing feature grid with builder-voice intro tooltips (mount + hover).
 */
export function HomeFeatureGrid() {
  const t = useTranslations();

  return (
    <TooltipProvider skipDelayDuration={0}>
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_FEATURES.map((feature) => {
          const Icon = FEATURE_ICONS[feature.icon];
          return (
            <Card key={feature.titleKey} className="relative">
              <CardHeader className="gap-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden={true} />
                  </span>
                  <BuilderFeatureHint
                    text={t(feature.tooltipKey)}
                    mountDelayMs={feature.mountHintDelayMs}
                  >
                    <button
                      type="button"
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t(feature.hintLabelKey)}
                    >
                      <CircleHelp className="size-4" aria-hidden={true} />
                    </button>
                  </BuilderFeatureHint>
                </div>
                <CardTitle className="text-base">{t(feature.titleKey)}</CardTitle>
                {feature.techLabelKey ? (
                  <p className="font-medium text-primary/80 text-xs tracking-wide uppercase">
                    {t(feature.techLabelKey)}
                  </p>
                ) : null}
                <CardDescription>{t(feature.bodyKey)}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>
    </TooltipProvider>
  );
}
