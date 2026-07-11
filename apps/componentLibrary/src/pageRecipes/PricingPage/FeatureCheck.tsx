'use client';

import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export interface FeatureCheckProps {
  /** Stagger index within the plan feature list. */
  readonly index: number;
  /**
   * When this changes (billing period flip), checks re-pop so the list
   * feels alive with the price roll.
   */
  readonly popKey: string;
}

/**
 * Feature checkmark with a spring bloated explode entrance.
 *
 * @param props - Stagger index and re-pop key.
 * @returns Animated check icon.
 * @example
 * <FeatureCheck index={0} popKey="annual" />
 */
export const FeatureCheck = ({ index, popKey }: FeatureCheckProps) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />;
  }

  return (
    <motion.span
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      aria-hidden="true"
      className="mt-0.5 inline-flex h-4 w-4 shrink-0 origin-center items-center justify-center text-emerald-600"
      initial={{ scale: 0, opacity: 0, rotate: -32 }}
      key={popKey}
      transition={{
        type: 'spring',
        stiffness: 560,
        damping: 11,
        mass: 0.5,
        delay: index * 0.05,
      }}
    >
      <Check className="h-4 w-4 drop-shadow-[0_0_6px_rgba(5,150,105,0.45)]" strokeWidth={2.5} />
    </motion.span>
  );
};
