import { IconBox } from '@vybekiit/ui/icon-box';

import { resolveIcon } from '@/components/ui/IconRegistry';
import { SectionShell } from '@/components/ui/SectionShell';
import { FEATURE_BADGES } from '@/data/landingContent';

/**
 * Four-up feature strip beneath the hero — each item is an accent `IconBox`
 * with a title and short description, mapped from `FEATURE_BADGES`.
 *
 * @returns The rendered feature-badge strip.
 * @example
 * <FeatureBadges />
 */
export const FeatureBadges = () => (
  <SectionShell id="features">
    <div className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      {FEATURE_BADGES.map((badge) => {
        const Icon = resolveIcon(badge.icon);
        return (
          <div className="flex items-start gap-3" key={badge.key}>
            <IconBox className="bg-primary/10 text-primary" size="md">
              <Icon className="h-5 w-5" />
            </IconBox>
            <div>
              <p className="font-semibold text-sm">{badge.title}</p>
              <p className="mt-0.5 text-muted-foreground text-sm">{badge.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  </SectionShell>
);
