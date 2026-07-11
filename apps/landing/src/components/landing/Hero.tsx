import { SectionShell } from '@/components/ui/SectionShell';
import { LANDING_HERO } from '@/data/landing';

/**
 * Centered hero — eyebrow, two-line headline, subhead.
 *
 * @returns The rendered Hero element.
 * @example
 * ```tsx
 * <Hero />
 * ```
 */

export const Hero = () => (
  <SectionShell className="hero-section relative text-center">
    <p className="landing-label mb-6">{LANDING_HERO.label}</p>
    <h1 className="hero-title mx-auto text-gradient-white">
      <span className="block">{LANDING_HERO.headlineLines[0]}</span>
      <span className="block">{LANDING_HERO.headlineLines[1]}</span>
    </h1>
    <p className="hero-subtext mx-auto mt-12 max-w-[940px] text-3xl leading-[1.42] text-[#B9BDC6]">
      {LANDING_HERO.subhead}
    </p>
  </SectionShell>
);
