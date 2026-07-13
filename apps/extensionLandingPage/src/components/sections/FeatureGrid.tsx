import { Card, CardContent } from '@vybekiit/ui/card';
import { IconBox } from '@vybekiit/ui/icon-box';

import { resolveIcon } from '@/components/ui/IconRegistry';
import { SectionShell } from '@/components/ui/SectionShell';
import { FEATURE_CARDS, FEATURE_GRID } from '@/data/landingContent';

/**
 * Feature grid — a heading and three feature `Card`s mapped from `FEATURE_CARDS`,
 * each with a decorative mini panel, an accent `IconBox`, a title, and a description.
 *
 * @returns The rendered feature-grid section.
 * @example
 * <FeatureGrid />
 */
export const FeatureGrid = () => (
  <SectionShell className="py-8 md:py-12">
    <h2 className="text-center font-bold text-3xl tracking-tight md:text-4xl">
      {FEATURE_GRID.heading}
    </h2>

    <div className="mt-10 grid gap-6 md:grid-cols-3">
      {FEATURE_CARDS.map((card) => {
        const Icon = resolveIcon(card.icon);
        return (
          <Card className="overflow-hidden" key={card.key}>
            <div className="flex h-36 items-center justify-center bg-muted/40">
              <IconBox className="bg-primary/10 text-primary" size="lg">
                <Icon className="h-6 w-6" />
              </IconBox>
            </div>
            <CardContent className="p-6 pt-6">
              <p className="font-semibold text-base">{card.title}</p>
              <p className="mt-1 text-muted-foreground text-sm">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </SectionShell>
);
