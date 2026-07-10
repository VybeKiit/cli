'use client';

import NumberFlow from '@number-flow/react';
import { useEffect } from 'react';
import { numberRollTiming, useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useReducedMotion } from '@/lib/motion';
import { parseDisplayNumber } from '@/lib/parseDisplayNumber';
import { cn } from '@/lib/utils';

export interface AnimatedNumberProps {
  /** Display string, e.g. "$29", "14-day", "+27.4%", "$2,841". */
  readonly value: string;
  /**
   * Optional start value (display string or raw number). Defaults to 0 so
   * every number counts up into place for a consistent page blend.
   */
  readonly from?: string | number;
  readonly className?: string;
  /** Force spin direction: 1 up, -1 down. Auto (up from 0) when omitted. */
  readonly trend?: 1 | -1 | 0;
  /** Intersection threshold for the once-per-load reveal. */
  readonly threshold?: number;
  /**
   * When set, use this instead of the local in-view gate so sibling numbers
   * in the same section start on the same tick.
   */
  readonly start?: boolean;
  /** Fired when NumberFlow finishes the roll into the final value. */
  readonly onAnimationsFinish?: (event: CustomEvent) => void;
}

const resolveFromValue = (from: string | number | undefined): number => {
  if (typeof from === 'number') {
    return from;
  }
  if (typeof from === 'string') {
    const fromParsed = parseDisplayNumber(from);
    return fromParsed === null ? 0 : fromParsed.value;
  }
  return 0;
};

/**
 * Rolling number reveal when the element enters view (once per page load).
 * Counts from 0 (or optional `from`) up to the target so every stat blends in.
 *
 * @param props - Component props.
 * @returns The rendered AnimatedNumber element.
 * @example
 * ```tsx
 * <AnimatedNumber value="$29" />
 * <AnimatedNumber value="14" />
 * ```
 */
export const AnimatedNumber = ({
  value,
  from,
  className,
  trend,
  threshold = 0.2,
  start: startProp,
  onAnimationsFinish,
}: AnimatedNumberProps) => {
  const { ref, inView } = useInViewOnce(threshold);
  const reduced = useReducedMotion();
  const parsed = parseDisplayNumber(value);
  const fromValue = resolveFromValue(from);
  const target = parsed === null ? 0 : parsed.value;
  const shouldStart = startProp === undefined ? inView : startProp;
  const animatedValue = useAnimatedNumber(target, shouldStart && parsed !== null, fromValue);

  let resolvedTrend: 1 | -1 | 0 = 1;
  if (trend !== undefined) {
    resolvedTrend = trend;
  } else if (fromValue > target) {
    resolvedTrend = -1;
  } else if (fromValue < target) {
    resolvedTrend = 1;
  } else {
    resolvedTrend = 0;
  }

  // Reduced motion skips the digit roll, so finish immediately for parent gates.
  useEffect(() => {
    if (!(shouldStart && reduced && onAnimationsFinish && parsed !== null)) {
      return;
    }
    onAnimationsFinish(new CustomEvent('animationsfinish'));
  }, [shouldStart, reduced, onAnimationsFinish, parsed]);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={cn('tabular-nums', className)} ref={ref as never}>
      <NumberFlow
        opacityTiming={{ duration: 280, easing: 'ease-out' }}
        prefix={parsed.prefix}
        spinTiming={numberRollTiming}
        suffix={parsed.suffix}
        transformTiming={numberRollTiming}
        trend={resolvedTrend}
        value={animatedValue}
        willChange={true}
        {...(onAnimationsFinish === undefined ? {} : { onAnimationsFinish })}
        {...(parsed.format === undefined ? {} : { format: parsed.format })}
      />
    </span>
  );
};
