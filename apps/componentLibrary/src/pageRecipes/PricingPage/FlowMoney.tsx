'use client';

import NumberFlow from '@number-flow/react';
import { cn } from '@/lib/utils';
import { priceRollTiming, USD_CENTS_FORMAT } from './priceRollTiming';

export interface FlowMoneyProps {
  /** Amount in integer cents (same unit as plan prices). */
  readonly cents: number;
  readonly className?: string;
}

/**
 * Rolling currency amount via NumberFlow. Digits spin when `cents` changes
 * (billing period toggle, seat count).
 *
 * @param props - Cents value and optional text classes.
 * @returns Animated currency span.
 * @example
 * <FlowMoney cents={2320} className="font-bold text-4xl" />
 */
export const FlowMoney = ({ cents, className = '' }: FlowMoneyProps) => (
  <NumberFlow
    className={cn('tabular-nums', className)}
    format={USD_CENTS_FORMAT}
    opacityTiming={{ duration: 220, easing: 'ease-out' }}
    spinTiming={priceRollTiming}
    transformTiming={priceRollTiming}
    value={cents / 100}
    willChange={true}
  />
);
