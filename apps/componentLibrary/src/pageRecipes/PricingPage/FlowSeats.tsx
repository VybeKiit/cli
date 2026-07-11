'use client';

import NumberFlow from '@number-flow/react';
import { cn } from '@/lib/utils';
import { priceRollTiming } from './priceRollTiming';

export interface FlowSeatsProps {
  readonly value: number;
  readonly className?: string;
}

/**
 * Rolling seat count for the pricing control.
 *
 * @param props - Seat integer and optional text classes.
 * @returns Animated seat number.
 * @example
 * <FlowSeats value={3} />
 */
export const FlowSeats = ({ value, className = '' }: FlowSeatsProps) => (
  <NumberFlow
    className={cn('tabular-nums', className)}
    opacityTiming={{ duration: 180, easing: 'ease-out' }}
    spinTiming={priceRollTiming}
    transformTiming={priceRollTiming}
    value={value}
    willChange={true}
  />
);
