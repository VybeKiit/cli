'use client';

import { useCallback, useState } from 'react';
import { CountdownPrice } from '@/components/ui/CountdownPrice';
import { PRICE, PRICE_VALUE_STACK } from '@/data/site';
import { cn } from '@/lib/utils';

/** Pricing hero — compare-at holds on scroll-in, then drops to sale price with discount reveal. */
export function PricingHeroPrice({
  countdownStart = false,
  onDropped,
}: {
  readonly countdownStart?: boolean;
  /** Fires once when the price finishes rolling down to the sale price. */
  readonly onDropped?: () => void;
}) {
  const [celebrate, setCelebrate] = useState(false);

  const handleDoneChange = useCallback(
    (done: boolean) => {
      if (done) {
        setCelebrate(true);
        onDropped?.();
      }
    },
    [onDropped],
  );

  return (
    <div className="mt-6">
      <div className="pricing-hero-stack">
        <div className="pricing-cadence-row">
          <span className="pricing-cadence text-[var(--text-soft)] text-xl">One-time</span>
          <span
            aria-hidden={!celebrate}
            className={cn(
              'pricing-savings-badge',
              celebrate ? 'pricing-savings-badge--visible' : 'pricing-savings-badge--hidden',
            )}
          >
            {PRICE_VALUE_STACK.savingsPercent}% discount
          </span>
        </div>

        <CountdownPrice
          className={cn('pricing-price text-white', celebrate && 'pricing-price--celebrate')}
          fromDisplay={PRICE_VALUE_STACK.compareAtDisplay}
          onDoneChange={handleDoneChange}
          start={countdownStart}
          toDisplay={PRICE.display}
        />
      </div>

      <p className="sr-only">
        Compare at {PRICE_VALUE_STACK.compareAtDisplay}, now {PRICE.display}. Save{' '}
        {PRICE_VALUE_STACK.savingsPercent}% ({PRICE_VALUE_STACK.basisNote})
      </p>
    </div>
  );
}
