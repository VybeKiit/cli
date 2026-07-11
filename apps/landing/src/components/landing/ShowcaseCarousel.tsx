'use client';

import type { ReactNode } from 'react';
import { AIOperatorSlide } from '@/components/landing/showcase-slides/AIOperatorSlide';
import { ExtensionSlide } from '@/components/landing/showcase-slides/ExtensionSlide';
import { MarketingBlocksSlide } from '@/components/landing/showcase-slides/MarketingBlocksSlide';
import { MobileAppSlide } from '@/components/landing/showcase-slides/MobileAppSlide';
import { WebAppSlide } from '@/components/landing/showcase-slides/WebAppSlide';
import { ChevronIcon } from '@/components/ui/CustomIcons';
import { SHOWCASE_SLIDES, type ShowcaseSlideMeta } from '@/data/landing';

const SLIDE_COMPONENTS: Record<string, () => ReactNode> = {
  operator: () => <AIOperatorSlide />,
  web: () => <WebAppSlide />,
  mobile: () => <MobileAppSlide />,
  extension: () => <ExtensionSlide />,
  marketing: () => <MarketingBlocksSlide />,
};

const ShowcaseCard = ({ slide }: { slide: ShowcaseSlideMeta }) => {
  const SlideContent = SLIDE_COMPONENTS[slide.id];

  return (
    <div
      className="showcase-card flex w-full shrink-0 flex-col overflow-hidden rounded-[16px] border border-[rgba(47,137,255,0.38)] p-[24px_22px_28px]"
      style={{
        background:
          'radial-gradient(75% 55% at 50% 0%, rgba(24, 105, 230, 0.22) 0%, rgba(5, 18, 38, 0.94) 48%, rgba(2, 7, 15, 0.98) 100%)',
        boxShadow:
          '0 0 0 1px rgba(60, 150, 255, 0.12), 0 0 12px rgba(47, 137, 255, 0.32), 0 0 34px rgba(22, 102, 220, 0.16), inset 0 0 32px rgba(35, 118, 255, 0.06)',
      }}
    >
      <div className="mb-[18px] shrink-0">
        <h3 className="text-lg font-extrabold leading-[1.1] tracking-[-0.03em] text-[#f8fafc]">
          {slide.title}
        </h3>
        <p className="mt-1.5 text-sm font-medium leading-[1.3] text-[rgba(226,232,240,0.7)]">
          {slide.subtitle}
        </p>
      </div>
      <div
        className="min-h-[260px] flex-1 overflow-hidden rounded-[12px] border-[3px] border-[rgba(20,35,58,0.95)] bg-[rgba(2,8,18,0.96)]"
        style={{
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
        }}
      >
        {SlideContent?.()}
      </div>
    </div>
  );
};

/**
 * Product-showcase carousel — all 5 cards visible in a horizontal row.
 *
 * @returns The rendered ShowcaseCarousel element.
 * @example
 * ```tsx
 * <ShowcaseCarousel />
 * ```
 */

export const ShowcaseCarousel = () => {
  return (
    <section
      className="relative pt-0 pb-[67px]"
      id="showcase"
      style={{
        background:
          'radial-gradient(ellipse 70% 46% at 50% 36%, rgba(0, 73, 170, 0.36), transparent 68%), radial-gradient(ellipse 44% 38% at 50% 54%, rgba(0, 32, 92, 0.38), transparent 72%), #000',
      }}
    >
      <div className="relative mx-auto w-full max-w-none px-[44px]">
        <div className="relative flex items-center">
          {/* Left Arrow */}
          <div
            aria-hidden="true"
            className="absolute -left-[26px] top-1/2 z-10 flex h-[52px] w-[52px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.24)] bg-[rgba(3,6,10,0.82)]"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.03)',
            }}
          >
            <ChevronIcon
              className="h-[18px] w-[18px] text-[rgba(255,255,255,0.5)]"
              direction="left"
            />
          </div>

          {/* Cards Row — all 5 visible */}
          <div className="grid w-full grid-cols-5 gap-0">
            {SHOWCASE_SLIDES.map((slide) => (
              <ShowcaseCard key={slide.id} slide={slide} />
            ))}
          </div>

          {/* Right Arrow */}
          <div
            aria-hidden="true"
            className="absolute -right-[26px] top-1/2 z-10 flex h-[52px] w-[52px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.24)] bg-[rgba(3,6,10,0.82)]"
            style={{
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.03)',
            }}
          >
            <ChevronIcon
              className="h-[18px] w-[18px] text-[rgba(255,255,255,0.5)]"
              direction="right"
            />
          </div>
        </div>

        {/* Pagination */}
        <div
          aria-hidden="true"
          className="mt-[28px] flex h-[24px] items-center justify-center gap-[14px]"
        >
          <span className="text-lg leading-none text-[rgba(255,255,255,0.42)]">∞</span>
          <div className="flex w-[280px] items-center gap-[5px]">
            <span className="h-[5px] flex-1 rounded-full bg-[rgba(255,255,255,0.16)]" />
            <span className="h-[5px] flex-1 rounded-full bg-[rgba(255,255,255,0.16)]" />
            <span className="h-[5px] flex-1 rounded-full bg-[#f8fbff] shadow-[0_0_10px_rgba(255,255,255,0.55)]" />
            <span className="h-[5px] flex-1 rounded-full bg-[rgba(255,255,255,0.16)]" />
            <span className="h-[5px] flex-1 rounded-full bg-[rgba(255,255,255,0.16)]" />
          </div>
          <span className="text-lg leading-none text-[rgba(255,255,255,0.42)]">∞</span>
        </div>
      </div>
    </section>
  );
};
