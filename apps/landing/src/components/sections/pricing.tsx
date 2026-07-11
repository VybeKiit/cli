'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { CheckoutOpenButton } from '@/components/CheckoutOpenButton';
import { useLivePricing } from '@/components/LivePricingProvider';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

/**
 * One-price CTA block for the visitor homepage.
 * Sale price and compare-at both roll from 0 in sync when the section enters view.
 * Compare-at gets a short diagonal markdown pencil strike once the roll finishes.
 * Live amount comes from the rising ladder (`/api/pricing`).
 *
 * @returns The rendered pricing section.
 * @example
 * <Pricing />
 */
export const Pricing = () => {
  const [priceDone, setPriceDone] = useState(false);
  const { messages } = useLandingLocale();
  const { pricing: live } = useLivePricing();
  const pricing = messages.pricing;
  const discount = `${live.savingsPercent}%`;
  const ctaLabel = `${pricing.cta} · ${live.display}`;

  return (
    <section id="pricing" className="border-border/60 border-t">
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2">
          <AnimatedNumber
            className={cn(
              'font-bold text-5xl tracking-tight transition-[filter] duration-500 sm:text-6xl',
              priceDone && 'drop-shadow-[0_0_18px_rgba(37,99,235,0.35)]',
            )}
            onAnimationsFinish={() => setPriceDone(true)}
            threshold={0.35}
            value={live.display}
          />
          <span className={cn('pricing-compare-wrap', priceDone && 'pricing-compare-wrap--struck')}>
            <AnimatedNumber
              className="pricing-compare-amount font-bold text-3xl tracking-tight text-muted-foreground sm:text-4xl"
              threshold={0.35}
              value={live.compareAtDisplay}
            />
            <span aria-hidden={true} className="pricing-pencil-strike">
              <span className="pricing-pencil-strike__line" />
              <svg
                aria-hidden={true}
                className="pricing-pencil-strike__pencil"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.5 4.5 19.5 9.5 8 21 H3 V16 L14.5 4.5 Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
                <path
                  d="M12.5 6.5 17.5 11.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
              </svg>
            </span>
          </span>
        </div>
        {priceDone ? (
          <div className="mt-4 space-y-2">
            <p className="pricing-fomo-line pricing-fomo-line--savings mx-auto max-w-lg text-xs sm:text-xs">
              {pricing.savingsBefore}
              <span className="pricing-fomo-discount">{discount}</span>
              {pricing.savingsAfter}
            </p>
            <p className="font-medium text-muted-foreground text-xs tracking-wide">
              {pricing.cadence}
              {live.isAtCeiling ? null : (
                <span className="text-muted-foreground/80"> · next buyer {live.nextDisplay}</span>
              )}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-muted-foreground text-sm">{pricing.cadence}</p>
        )}
        <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-start text-sm">
          {pricing.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden={true} />
              <span>{bullet}</span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden={true} />
            <span>
              {pricing.refundBulletPrefix}
              <AnimatedNumber value="14" />
              {pricing.refundBulletSuffix}
            </span>
          </li>
        </ul>
        <CheckoutOpenButton
          location="pricing"
          className="mt-10 w-full px-8 sm:w-auto"
          trackLabel={ctaLabel}
        >
          {pricing.cta} · <AnimatedNumber value={live.display} />
        </CheckoutOpenButton>
        <p className="sr-only">
          Compare at {live.compareAtDisplay}, now {live.display}. {pricing.cadence}.
        </p>
      </div>
    </section>
  );
};
