'use client';

import { CheckoutOpenButton } from '@/components/CheckoutOpenButton';
import { useLivePricing } from '@/components/LivePricingProvider';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

const STAGE_NUMBERS = ['01', '02', '03', '04'] as const;

/**
 * Education-first story: pure vibe coding stalls at the mess; soft CTA to VybeKiit.
 *
 * @returns The rendered vibe-story section.
 * @example
 * <VibeStory />
 */
export const VibeStory = () => {
  const { messages } = useLandingLocale();
  const { pricing: live } = useLivePricing();
  const story = messages.vibeStory;
  const ctaLabel = `${story.cta} · ${live.display}`;

  return (
    <section
      aria-labelledby="vibe-story-heading"
      className="border-border/60 border-t bg-muted/20"
      id="vibe-story"
    >
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
          {story.label}
        </p>
        <h2
          className="mt-2 max-w-2xl font-bold text-2xl tracking-tight sm:text-3xl"
          id="vibe-story-heading"
        >
          {story.heading}
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground text-sm leading-relaxed sm:text-base">
          {story.lead}
        </p>

        <ol className="mt-8 grid gap-3 sm:grid-cols-2">
          {story.stages.map((stage, index) => (
            <li
              key={stage.id}
              className={cn(
                'rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-sm',
                'flex flex-col gap-1',
              )}
            >
              <span className="font-semibold text-muted-foreground text-xs tabular-nums tracking-wider">
                {STAGE_NUMBERS[index] ?? String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="font-semibold text-foreground text-base tracking-tight">
                {stage.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-snug">{stage.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 max-w-2xl space-y-3">
          <p className="font-medium text-foreground text-sm leading-relaxed sm:text-base">
            {story.bottomLine}
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">{story.softCta}</p>
          <CheckoutOpenButton
            className="mt-1 w-full px-6 sm:w-auto"
            location="vibe_story"
            trackLabel={ctaLabel}
          >
            {story.cta} · <AnimatedNumber value={live.display} />
          </CheckoutOpenButton>
        </div>
      </div>
    </section>
  );
};
