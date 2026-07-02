'use client';

import { AIOperatorSlide } from '@/components/landing/showcase-slides/AIOperatorSlide';
import { ExtensionSlide } from '@/components/landing/showcase-slides/ExtensionSlide';
import { MarketingBlocksSlide } from '@/components/landing/showcase-slides/MarketingBlocksSlide';
import { MobileAppSlide } from '@/components/landing/showcase-slides/MobileAppSlide';
import { WebAppSlide } from '@/components/landing/showcase-slides/WebAppSlide';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { GlowCard } from '@/components/ui/GlowCard';
import { SHOWCASE_SLIDES, type ShowcaseSlideMeta } from '@/data/landing';
import type { ReactNode } from 'react';

const SLIDE_COMPONENTS: Record<string, () => ReactNode> = {
  operator: () => <AIOperatorSlide />,
  web: () => <WebAppSlide />,
  mobile: () => <MobileAppSlide />,
  extension: () => <ExtensionSlide />,
  marketing: () => <MarketingBlocksSlide />,
};

function ShowcaseCard({ slide }: { slide: ShowcaseSlideMeta }) {
  const SlideContent = SLIDE_COMPONENTS[slide.id];

  return (
    <GlowCard className="showcase-card flex h-[520px] w-[min(85vw,360px)] shrink-0 flex-col overflow-hidden">
      <div className="mb-4 shrink-0">
        <h3 className="font-bold text-base text-white lg:text-lg">{slide.title}</h3>
        <p className="text-[var(--text-muted)] text-xs lg:text-sm">{slide.subtitle}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/8">
        {SlideContent?.()}
      </div>
    </GlowCard>
  );
}

/** Product-showcase carousel — an infinite auto-scrolling loop of the slides. */
export function ShowcaseCarousel() {
  return (
    <section className="blue-top-glow relative py-16 md:py-24" id="showcase">
      <div className="relative mx-auto w-[calc(100%-48px)] max-w-[1520px]">
        <AutoScrollRow ariaLabel="Product showcase" durationDesktop="70s" durationMobile="55s">
          <ul className="auto-scroll-row-showcase">
            {SHOWCASE_SLIDES.map((slide) => (
              <li key={slide.id}>
                <ShowcaseCard slide={slide} />
              </li>
            ))}
          </ul>
        </AutoScrollRow>
      </div>
    </section>
  );
}
