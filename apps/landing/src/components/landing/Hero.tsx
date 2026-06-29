'use client';

import { AnimatedUnderlineText } from '@/components/landing/hero/AnimatedUnderlineText';
import { HeroBuilderToolOrbit } from '@/components/landing/hero/HeroBuilderToolOrbit';
import { ComponentShowcaseCarousel } from '@/components/landing/ComponentShowcaseCarousel';
import { HeroComponentCountBadge } from '@/components/landing/HeroComponentCountBadge';
import { CheckoutCTA } from '@/components/ui/CheckoutCTA';
import { TypewriterSequence } from '@/components/ui/TypewriterSequence';
import { SectionShell } from '@/components/ui/SectionShell';
import { LANDING_HERO } from '@/data/landing';
import { motion } from 'framer-motion';

/** Center-aligned hero with builder-tool orbit, typewriter copy, and animated underline. */
export function Hero() {
  return (
    <SectionShell className="hero-section relative text-center">
      <HeroBuilderToolOrbit />

      <TypewriterSequence
        className="relative z-10 mx-auto max-w-[1180px]"
        lines={[
          { text: LANDING_HERO.label, as: 'p', className: 'landing-label mb-8' },
          {
            text: LANDING_HERO.headlineLines[0],
            as: 'span',
            className: 'hero-title text-gradient-white block max-w-[1180px] lg:whitespace-nowrap',
          },
          {
            text: LANDING_HERO.headlineLines[1],
            as: 'span',
            className: 'hero-title text-gradient-white block max-w-[1180px] lg:whitespace-nowrap',
          },
          {
            text: LANDING_HERO.subhead,
            as: 'p',
            className:
              'mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--text-muted)] md:text-xl md:leading-[1.55]',
          },
        ]}
        renderBetween={(index) => (index === 2 ? <br key="hero-break" /> : null)}
        renderLineWrap={(index, line, { lineComplete }) =>
          index === 2 ? (
            <AnimatedUnderlineText active={lineComplete}>{line}</AnimatedUnderlineText>
          ) : (
            line
          )
        }
      />

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 mt-10 flex justify-center"
        initial={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.8, delay: 0.55 }}
      >
        <CheckoutCTA>{LANDING_HERO.ctaLabel}</CheckoutCTA>
      </motion.div>

      <HeroComponentCountBadge />
      <ComponentShowcaseCarousel />
    </SectionShell>
  );
}
