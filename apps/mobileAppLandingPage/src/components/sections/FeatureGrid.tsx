import { Card, CardContent } from '@vybekiit/ui/card';
import { IconBox } from '@vybekiit/ui/icon-box';

import { SectionShell } from '@/components/ui/SectionShell';
import { FEATURES, FEATURES_HEADING } from '@/data/landingContent';

/**
 * Feature section — heading plus a responsive 4-up grid of feature cards mapped
 * from the `FEATURES` data array, each an accent `IconBox` over a title and blurb.
 *
 * @returns The rendered feature grid.
 * @example
 * <FeatureGrid />
 */
export const FeatureGrid = () => (
  <SectionShell className="py-20 md:py-28" id="features">
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{FEATURES_HEADING.title}</h2>
      <p className="mt-4 text-lg text-muted-foreground">{FEATURES_HEADING.subtitle}</p>
    </div>

    <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {FEATURES.map(({ key, title, description, icon: Icon }) => (
        <Card key={key} className="h-full border-border">
          <CardContent className="flex flex-col gap-4 p-6">
            <IconBox className="bg-primary/10 text-primary" size="lg">
              <Icon className="h-6 w-6" />
            </IconBox>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </SectionShell>
);
