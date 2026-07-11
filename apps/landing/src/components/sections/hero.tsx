'use client';

import { BuiltWithVybeKiitNote } from '@/components/sections/BuiltWithVybeKiitNote';
import { HeroAgentTerminal } from '@/components/sections/HeroAgentTerminal';
import { HeroCta } from '@/components/sections/HeroCta';
import { PRICE } from '@/data/site';
import { useLandingLocale } from '@/i18n/LocaleProvider';

/**
 * Light hero: plain-language pitch on the left, agent terminal on the right.
 * Copy follows the active landing locale (EN / HE / RU / AR).
 *
 * @returns The rendered hero section.
 * @example
 * <Hero />
 */
export const Hero = () => {
  const { messages } = useLandingLocale();
  const { hero } = messages;

  return (
    <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
      <div className="flex flex-col items-start gap-6">
        <p className="text-muted-foreground text-sm">{hero.eyebrow}</p>
        <h1 className="text-balance font-bold text-4xl leading-[1.4] tracking-tight sm:text-5xl sm:leading-[1.38]">
          {hero.headlineBefore}
          <span className="marker-highlight">{hero.headlineHighlight}</span>
          {hero.headlineAfter}
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground leading-relaxed">
          {hero.subheadBeforePrice}
          <span className="font-semibold text-foreground">{PRICE.display}</span>
          {hero.subheadAfterPrice}
        </p>
        <HeroCta />
      </div>
      <div className="flex flex-col gap-3">
        <HeroAgentTerminal />
        <BuiltWithVybeKiitNote />
      </div>
    </section>
  );
};
