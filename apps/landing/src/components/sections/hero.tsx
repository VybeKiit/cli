import { BuiltWithVybeKiitNote } from '@/components/sections/BuiltWithVybeKiitNote';
import { HeroAgentTerminal } from '@/components/sections/HeroAgentTerminal';
import { HeroCta } from '@/components/sections/HeroCta';
import { PRICE } from '@/data/site';
import { VISITOR_HERO } from '@/data/visitorLanding';

/**
 * Light hero: plain-language pitch on the left, agent terminal on the right.
 * Headline + subcopy are Server Component HTML so mobile LCP paints without
 * waiting on the checkout/animation client islands. Handwritten “built with”
 * note sits under the terminal as meta product proof.
 *
 * @returns The rendered hero section.
 * @example
 * <Hero />
 */
export const Hero = () => (
  <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
    <div className="flex flex-col items-start gap-6">
      <p className="text-muted-foreground text-sm">{VISITOR_HERO.eyebrow}</p>
      <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
        Go live, and take <span className="marker-highlight">{VISITOR_HERO.headlineHighlight}</span>
        , in session one.
      </h1>
      <p className="max-w-xl text-balance text-lg text-muted-foreground leading-relaxed">
        Describe it in plain language. The agent wires payments, auth, database, and deploy across
        web, mobile, and a browser extension. One purchase,{' '}
        <span className="font-semibold text-foreground">{PRICE.display}</span>.
      </p>
      <HeroCta />
    </div>
    <div className="flex flex-col gap-3">
      <HeroAgentTerminal />
      <BuiltWithVybeKiitNote />
    </div>
  </section>
);
