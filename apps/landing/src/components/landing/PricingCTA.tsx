'use client';

import { TestimonialsBlock } from '@/components/landing/TestimonialsBlock';
import { CheckoutCTA } from '@/components/ui/CheckoutCTA';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon } from '@/components/ui/CustomIcons';
import { SectionShell } from '@/components/ui/SectionShell';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { useTypewriterSequence } from '@/hooks/useTypewriterSequence';
import { PRICING_BULLETS } from '@/data/landing';
import { PRICE } from '@/data/site';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const REFUND_COPY = '14-day refund no questions asked';
const CHECK_SPLASH_MS = 320;

function PricingBullets() {
  const { ref, inView } = useInViewOnce();
  const { displayLines, activeIndex, isComplete, splashingIndex } = useTypewriterSequence(
    PRICING_BULLETS,
    {
      start: inView,
      pauseAfterLineMs: CHECK_SPLASH_MS,
    },
  );

  return (
    <ul className="mt-8 space-y-4" ref={ref as never}>
      {PRICING_BULLETS.map((bullet, index) => (
        <li className="flex items-start gap-3 text-[var(--text-soft)]" key={bullet}>
          <span
            className={cn(
              'landing-check-icon shrink-0',
              splashingIndex === index && 'landing-check-splash',
            )}
          >
            <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
          </span>
          <span
            className={cn(index === activeIndex && inView && !isComplete && 'typewriter-cursor')}
          >
            {displayLines[index]}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Pricing CTA section with $29 offer; testimonials block sits below the panel. */
export function PricingCTA() {
  return (
    <SectionShell className="py-16 md:py-24" id="pricing">
      <div className="pricing-panel blue-top-glow overflow-hidden">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.75 }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="landing-label flex items-center gap-2">
              <ClockIcon className="h-4 w-4" />
              LIMITED TIME OFFER
            </p>
            <p className="pricing-price mt-6 text-white">
              <AnimatedNumber value={PRICE.display} />
            </p>
            <p className="mt-2 text-[var(--text-soft)] text-xl">One-time</p>
            <PricingBullets />
          </motion.div>

          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <CheckoutCTA size="pricing">Get VybeKiit Now</CheckoutCTA>
            <p className="mt-4 text-center text-[var(--text-muted)] text-sm">
              One payment Lifetime access
            </p>
            <p className="mt-3 flex items-center justify-center gap-2 text-[var(--text-soft)] text-sm">
              <span className="landing-trust-shimmer inline-flex shrink-0 rounded-full">
                <ShieldCheckIcon className="h-4 w-4 text-[var(--blue-soft)]" />
              </span>
              <TypewriterText as="span" text={REFUND_COPY} />
            </p>
          </motion.div>
        </div>
      </div>

      <TestimonialsBlock />
    </SectionShell>
  );
}
