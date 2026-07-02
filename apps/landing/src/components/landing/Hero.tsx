import { SectionShell } from '@/components/ui/SectionShell';
import { LANDING_HERO } from '@/data/landing';

/** Left-aligned hero — eyebrow, two-line headline, subhead. */
export function Hero() {
  return (
    <SectionShell className="hero-section relative">
      <p className="landing-label mb-6">{LANDING_HERO.label}</p>
      <h1 className="hero-title text-gradient-white">
        <span className="block">{LANDING_HERO.headlineLines[0]}</span>
        <span className="block">{LANDING_HERO.headlineLines[1]}</span>
      </h1>
      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--text-muted)] md:text-xl md:leading-[1.55]">
        {LANDING_HERO.subhead}
      </p>
    </SectionShell>
  );
}
