'use client';

import { BlueFlare } from '@/components/landing/BlueFlare';
import { AIOperatorSlide } from '@/components/landing/showcase-slides/AIOperatorSlide';
import { ExtensionSlide } from '@/components/landing/showcase-slides/ExtensionSlide';
import { MarketingBlocksSlide } from '@/components/landing/showcase-slides/MarketingBlocksSlide';
import { MobileAppSlide } from '@/components/landing/showcase-slides/MobileAppSlide';
import { PricingPlanSlide } from '@/components/landing/showcase-slides/PricingPlanSlide';
import { WebAppSlide } from '@/components/landing/showcase-slides/WebAppSlide';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { TypewriterSequence } from '@/components/ui/TypewriterSequence';
import { GlowCard } from '@/components/ui/GlowCard';
import {
  LANDING_EASE,
  SHOWCASE_SECTION,
  SHOWCASE_SLIDES,
  type ShowcaseSlideMeta,
} from '@/data/landing';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const SLIDE_COMPONENTS: Record<string, () => ReactNode> = {
  operator: () => <AIOperatorSlide />,
  web: () => <WebAppSlide />,
  mobile: () => <MobileAppSlide />,
  extension: () => <ExtensionSlide />,
  marketing: () => <MarketingBlocksSlide />,
  'pricing-plan': () => <PricingPlanSlide />,
};

function ShowcaseCard({ slide, className }: { slide: ShowcaseSlideMeta; className?: string }) {
  const SlideContent = SLIDE_COMPONENTS[slide.id];

  return (
    <GlowCard
      className={cn(
        'showcase-card flex h-[500px] shrink-0 flex-col overflow-hidden lg:h-[520px] lg:p-7',
        className,
      )}
    >
      <div className="mb-3 shrink-0 lg:mb-4">
        <h3 className="font-bold text-base text-white lg:text-lg">{slide.title}</h3>
        <p className="text-[var(--text-muted)] text-xs lg:text-sm">{slide.subtitle}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/8">
        {SlideContent?.()}
      </div>
    </GlowCard>
  );
}

/** Product demo cards in a continuous auto-scroll row. */
export function ShowcaseCarousel() {
  return (
    <section className="blue-top-glow relative py-16 md:py-24" id="showcase">
      <div className="relative mx-auto w-[calc(100%-48px)] max-w-[1520px]">
        <BlueFlare
          className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          variant="carousel"
        />

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.9, delay: 0.75, ease: LANDING_EASE }}
        >
          <div className="mb-8">
            <p className="landing-label">Component showroom</p>
            <TypewriterSequence
              lines={[
                {
                  text: SHOWCASE_SECTION.heading,
                  as: 'h2',
                  className: 'mt-2 text-3xl font-[800] tracking-[-0.04em] text-white md:text-5xl',
                },
                {
                  text: SHOWCASE_SECTION.subtext,
                  as: 'p',
                  className: 'mt-3 max-w-2xl text-base text-[var(--text-muted)] md:text-lg',
                },
              ]}
            />
          </div>

          <AutoScrollRow
            ariaLabel="Product showcase"
            durationDesktop="80s"
            durationMobile="55s"
            pauseOnHover={false}
            rowClassName="auto-scroll-row-showcase"
          >
            {SHOWCASE_SLIDES.map((slide) => (
              <ShowcaseCard
                className="w-[min(85vw,420px)] p-4 lg:p-7"
                key={slide.id}
                slide={slide}
              />
            ))}
          </AutoScrollRow>
        </motion.div>
      </div>
    </section>
  );
}
