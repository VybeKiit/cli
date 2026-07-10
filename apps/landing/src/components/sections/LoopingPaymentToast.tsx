'use client';

import NumberFlow from '@number-flow/react';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Show each amount for ~1.4s, then 0.7s gap before the next amount. */
const HOLD_VISIBLE_MS = 1400;
const HIDDEN_GAP_MS = 700;

const CURRENCY_FORMAT = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

const rollTiming = { duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } as const;

const randomAmountCents = (): number => 1299 + Math.floor(Math.random() * 28_900);

/**
 * Payment success toast that loops: show 1 amount, hide, then a new amount.
 * Styled like a real product toast (not a generic green strip).
 *
 * @returns The looping toast element.
 * @example
 * <LoopingPaymentToast />
 */
export const LoopingPaymentToast = () => {
  const reduced = useReducedMotion();
  const [amountCents, setAmountCents] = useState(() => randomAmountCents());
  const [visible, setVisible] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduced) {
      return;
    }

    if (visible) {
      const hideTimer = globalThis.setTimeout(() => {
        setVisible(false);
      }, HOLD_VISIBLE_MS);
      return () => globalThis.clearTimeout(hideTimer);
    }

    const showTimer = globalThis.setTimeout(() => {
      setAmountCents(randomAmountCents());
      setTick((value) => value + 1);
      setVisible(true);
    }, HIDDEN_GAP_MS);
    return () => globalThis.clearTimeout(showTimer);
  }, [reduced, visible]);

  const amountUsd = amountCents / 100;
  const trend = tick % 2 === 0 ? 1 : -1;

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-3 right-3 z-10 flex max-w-[min(100%-1.5rem,240px)] items-start gap-2.5 rounded-xl border border-border/80 bg-card/95 px-3 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-all duration-500 dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
      )}
      role="status"
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <svg aria-hidden={true} className="size-3.5" fill="none" viewBox="0 0 16 16">
          <path
            d="M3.5 8.5l3 3 6-7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[11px] text-muted-foreground leading-none">
          Payment received
        </p>
        <p className="mt-1 font-semibold text-foreground text-sm tabular-nums tracking-tight">
          <NumberFlow
            format={CURRENCY_FORMAT}
            opacityTiming={{ duration: 0 }}
            prefix="$"
            spinTiming={rollTiming}
            transformTiming={rollTiming}
            trend={trend}
            value={amountUsd}
            willChange={true}
          />
        </p>
      </div>
      <span aria-hidden={true} className="text-muted-foreground/50 text-xs leading-none">
        ×
      </span>
    </div>
  );
};
