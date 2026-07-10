'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';
import { CheckoutOpenButton } from '@/components/CheckoutOpenButton';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { VISITOR_PRICING } from '@/data/visitorLanding';
import { cn } from '@/lib/utils';

/**
 * One-price CTA block for the visitor homepage.
 * Sale price and compare-at both roll from 0 in sync when the section enters view.
 * Compare-at gets a short diagonal markdown pencil strike once the roll finishes.
 * Savings / scarcity lines are static (no letter wave).
 *
 * @returns The rendered pricing section.
 * @example
 * <Pricing />
 */
export const Pricing = () => {
  const [priceDone, setPriceDone] = useState(false);
  const discount = VISITOR_PRICING.savingsDiscount;
  const discountAt = VISITOR_PRICING.savingsLine.indexOf(discount);
  const savingsBefore = discountAt >= 0 ? VISITOR_PRICING.savingsLine.slice(0, discountAt) : '';
  const savingsAfter =
    discountAt >= 0
      ? VISITOR_PRICING.savingsLine.slice(discountAt + discount.length)
      : VISITOR_PRICING.savingsLine;

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
            value={VISITOR_PRICING.display}
          />
          <span className={cn('pricing-compare-wrap', priceDone && 'pricing-compare-wrap--struck')}>
            <AnimatedNumber
              className="pricing-compare-amount font-bold text-3xl tracking-tight text-muted-foreground sm:text-4xl"
              threshold={0.35}
              value={VISITOR_PRICING.compareAt}
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
            <p className="pricing-fomo-line pricing-fomo-line--savings mx-auto max-w-lg text-[11px] sm:text-xs">
              {savingsBefore}
              <span className="pricing-fomo-discount">{discount}</span>
              {savingsAfter}
            </p>
            <p className="font-medium text-muted-foreground text-xs tracking-wide">
              {VISITOR_PRICING.cadence}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-muted-foreground text-sm">{VISITOR_PRICING.cadence}</p>
        )}
        <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-3 text-start text-sm">
          {VISITOR_PRICING.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-blue-600" aria-hidden={true} />
              <span>
                {bullet.startsWith('14-day') ? (
                  <>
                    <AnimatedNumber value="14" />
                    -day money-back guarantee.
                  </>
                ) : (
                  bullet
                )}
              </span>
            </li>
          ))}
        </ul>
        <CheckoutOpenButton
          location="pricing"
          className="mt-10 w-full px-8 sm:w-auto"
          trackLabel={VISITOR_PRICING.ctaLabel}
        >
          Get VybeKiit · <AnimatedNumber value={VISITOR_PRICING.display} />
        </CheckoutOpenButton>
        <p className="sr-only">
          Compare at {VISITOR_PRICING.compareAt}, now {VISITOR_PRICING.display}.{' '}
          {VISITOR_PRICING.savingsLine}. {VISITOR_PRICING.cadence}.
        </p>
      </div>
    </section>
  );
};
