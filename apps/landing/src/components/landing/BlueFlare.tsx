'use client';

import { motion } from 'framer-motion';
import { LANDING_EASE } from '@/data/landing';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface BlueFlareProps {
  className?: string;
  /** Hero flare is brighter; carousel variant is dimmer. */
  variant?: 'hero' | 'carousel';
}

/**
 * Layered CSS lens flare — thin streak + soft halo, with breathe animation.
 *
 * @param props - Component props.
 * @returns The rendered BlueFlare element.
 * @example
 * ```tsx
 * <BlueFlare />
 * ```
 */

export const BlueFlare = ({ className, variant = 'hero' }: BlueFlareProps) => {
  const reduced = useReducedMotion();
  const dim = variant === 'carousel';
  const streakOpacityStill = dim ? 0.35 : 0.7;
  const haloOpacity = dim ? 0.06 : 0.2;

  return (
    <div aria-hidden="true" className={cn('pointer-events-none relative', className)}>
      <motion.div
        animate={
          reduced
            ? { opacity: streakOpacityStill, scaleX: 1 }
            : {
                opacity: dim ? [0.25, 0.45, 0.25] : [0.7, 1, 0.7],
                scaleX: [1, 1.12, 1],
              }
        }
        className={cn('blue-flare', dim && 'blue-flare-dim')}
        initial={false}
        transition={
          reduced
            ? { duration: 1.4, delay: 0.2, ease: LANDING_EASE }
            : {
                opacity: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
                scaleX: { duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' },
              }
        }
      />
      <motion.div
        animate={{ opacity: haloOpacity }}
        className={cn('blue-flare-halo', dim && 'opacity-[0.06]')}
        initial={false}
        transition={{ duration: 1.4, delay: 0.2, ease: LANDING_EASE }}
      />
    </div>
  );
};
