'use client';

import { useEffect } from 'react';
import { PRICE, PRICE_VALUE_STACK } from '@/data/site';

/**
 * Pricing hero — static target-state $29 offer.
 *
 * @param props - Component props.
 * @returns The rendered PricingHeroPrice element.
 * @example
 * ```tsx
 * <PricingHeroPrice />
 * ```
 */

export const PricingHeroPrice = ({
  countdownStart: _countdownStart = false,
  onDropped,
}: {
  readonly countdownStart?: boolean;
  /** Fires once when the price finishes rolling down to the sale price. */
  readonly onDropped?: () => void;
}) => {
  useEffect(() => {
    onDropped?.();
  }, [onDropped]);

  return (
    <div className="mt-8">
      <div className="pricing-hero-stack">
        <div className="pricing-value-row">
          <span className="pricing-price text-white">
            <span>$</span>
            <span className="pricing-price-amount">{PRICE.amount}</span>
          </span>
          <span className="pricing-cadence pb-2 text-[32px] text-white">One-time</span>
        </div>
      </div>

      <p className="sr-only">
        Compare at {PRICE_VALUE_STACK.compareAtDisplay}, now {PRICE.display}. Save{' '}
        {PRICE_VALUE_STACK.savingsPercent}% ({PRICE_VALUE_STACK.basisNote})
      </p>
    </div>
  );
};
