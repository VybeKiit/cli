'use client';

import NumberFlow from '@number-flow/react';
import { spinTiming } from '@/components/ui/TypewriterText';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { parseDisplayNumber } from '@/lib/parseDisplayNumber';
import { cn } from '@/lib/utils';

export interface AnimatedNumberProps {
  readonly value: string;
  readonly className?: string;
}

/** Rolling number reveal when the element enters view (once per page load). */
export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const { ref, inView } = useInViewOnce();
  const parsed = parseDisplayNumber(value);
  const target = parsed?.value ?? 0;
  const animatedValue = useAnimatedNumber(target, inView && parsed !== null);

  if (!parsed) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={cn('tabular-nums', className)} ref={ref as never}>
      <NumberFlow
        opacityTiming={{ duration: 0 }}
        prefix={parsed.prefix}
        spinTiming={spinTiming}
        suffix={parsed.suffix}
        trend={1}
        value={animatedValue}
        {...(parsed.format ? { format: parsed.format } : {})}
      />
    </span>
  );
}
