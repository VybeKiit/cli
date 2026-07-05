'use client';

import NumberFlow from '@number-flow/react';
import { useCallback, useEffect } from 'react';
import { pricingDropTiming, useCountdownNumber } from '@/hooks/useCountdownNumber';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { parseDisplayNumber } from '@/lib/parseDisplayNumber';
import { cn } from '@/lib/utils';

/** Integer price display — design shows $29 with no cents. */
const PRICE_ROLL_FORMAT = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
} as const;

export interface CountdownPriceProps {
  readonly fromDisplay: string;
  readonly toDisplay: string;
  readonly className?: string;
  /** When false, holds at compare-at. Parent should flip true after section is visible. */
  readonly start?: boolean;
  readonly onComplete?: () => void;
  readonly onDoneChange?: (done: boolean) => void;
}

/** Rolling price countdown when the element enters view (once per page load). */
export function CountdownPrice({
  fromDisplay,
  toDisplay,
  className,
  start: startProp = false,
  onComplete,
  onDoneChange,
}: CountdownPriceProps) {
  const { ref, inView } = useInViewOnce(0.35);
  const fromParsed = parseDisplayNumber(fromDisplay);
  const toParsed = parseDisplayNumber(toDisplay);

  const fromValue = fromParsed?.value ?? 0;
  const toValue = toParsed?.value ?? 0;
  const prefix = fromParsed?.prefix ?? toParsed?.prefix ?? '$';

  const shouldStart = startProp && inView && fromParsed !== null && toParsed !== null;
  const { value, done } = useCountdownNumber(fromValue, toValue, shouldStart);

  const handleAnimationsFinish = useCallback(() => {
    onDoneChange?.(true);
    onComplete?.();
  }, [onComplete, onDoneChange]);

  useEffect(() => {
    if (done) {
      onDoneChange?.(true);
    }
  }, [done, onDoneChange]);

  if (!(fromParsed && toParsed)) {
    return (
      <span className={className} data-testid="pricing-countdown">
        {toDisplay}
      </span>
    );
  }

  return (
    <span
      className={cn('tabular-nums', className)}
      data-phase={shouldStart ? (value === fromValue ? 'holding' : 'dropping') : 'idle'}
      data-testid="pricing-countdown"
      ref={ref as never}
    >
      <NumberFlow
        format={PRICE_ROLL_FORMAT}
        onAnimationsFinish={handleAnimationsFinish}
        opacityTiming={{ duration: 0 }}
        prefix={prefix}
        spinTiming={pricingDropTiming}
        suffix=""
        transformTiming={pricingDropTiming}
        trend={-1}
        value={value}
        willChange={true}
      />
    </span>
  );
}
