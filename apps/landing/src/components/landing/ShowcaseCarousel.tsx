'use client';

import type { ReactNode } from 'react';
import { AIOperatorSlide } from '@/components/landing/showcase-slides/AIOperatorSlide';
import { ExtensionSlide } from '@/components/landing/showcase-slides/ExtensionSlide';
import { MarketingBlocksSlide } from '@/components/landing/showcase-slides/MarketingBlocksSlide';
import { MobileAppSlide } from '@/components/landing/showcase-slides/MobileAppSlide';
import { WebAppSlide } from '@/components/landing/showcase-slides/WebAppSlide';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { ChevronIcon } from '@/components/ui/CustomIcons';
import { GlowCard } from '@/components/ui/GlowCard';
import { SHOWCASE_SLIDES, type ShowcaseSlideMeta } from '@/data/landing';

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
    <section className="relative py-16 md:py-24" id="showcase">
      <div className="relative mx-auto w-[calc(100%-48px)] max-w-[1520px]">
        <div className="showcase-carousel-stage relative">
          <div className="showcase-carousel-shell relative">
            <div
              aria-hidden="true"
              className="showcase-carousel-nav showcase-carousel-nav--left pointer-events-none"
            >
              <ChevronIcon className="h-5 w-5 text-white/70" direction="left" />
            </div>

            <div className="showcase-carousel-track-wrap relative">
              <div aria-hidden="true" className="showcase-carousel-beam pointer-events-none" />
              <AutoScrollRow
                ariaLabel="Product showcase"
                durationDesktop="70s"
                durationMobile="55s"
                hoverBehavior="accelerate-reverse"
                pauseOnHover={false}
              >
                <ul className="auto-scroll-row-showcase">
                  {SHOWCASE_SLIDES.map((slide) => (
                    <li key={slide.id}>
                      <ShowcaseCard slide={slide} />
                    </li>
                  ))}
                </ul>
              </AutoScrollRow>
            </div>

            <div
              aria-hidden="true"
              className="showcase-carousel-nav showcase-carousel-nav--right pointer-events-none"
            >
              <ChevronIcon className="h-5 w-5 text-white/70" direction="right" />
            </div>
          </div>

          <div aria-hidden="true" className="showcase-carousel-infinity">
            <span className="showcase-carousel-infinity-glyph">∞</span>
            <div className="showcase-carousel-infinity-track">
              <span className="showcase-carousel-infinity-segment" />
              <span className="showcase-carousel-infinity-segment" />
              <span className="showcase-carousel-infinity-segment showcase-carousel-infinity-segment--active" />
              <span className="showcase-carousel-infinity-segment" />
              <span className="showcase-carousel-infinity-segment" />
            </div>
            <span className="showcase-carousel-infinity-glyph">∞</span>
          </div>
        </div>
      </div>
    </section>
  );
}
