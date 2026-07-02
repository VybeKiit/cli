'use client';

import { TestimonialsBlock } from '@/components/landing/TestimonialsBlock';
import { CheckoutCTA } from '@/components/ui/CheckoutCTA';
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon } from '@/components/ui/CustomIcons';
import { SectionShell } from '@/components/ui/SectionShell';
import { PRICING_BULLETS } from '@/data/landing';
import { PRICE } from '@/data/site';
import { motion } from 'framer-motion';

const REFUND_COPY = '14-day refund, no questions asked.';

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
            <div className="mt-6 flex items-end gap-3">
              <span className="pricing-price text-white">{PRICE.display}</span>
              <span className="mb-2 text-[var(--text-soft)] text-xl">One-time</span>
            </div>
            <ul className="mt-8 space-y-4">
              {PRICING_BULLETS.map((bullet) => (
                <li className="flex items-start gap-3 text-[var(--text-soft)]" key={bullet}>
                  <span className="landing-check-icon shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-[var(--blue-soft)]" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <CheckoutCTA icon="lock" size="pricing">
              Get VybeKiit Now
            </CheckoutCTA>
            <p className="mt-4 text-center text-[var(--text-muted)] text-sm">
              One payment. Lifetime access.
            </p>
            <p className="mt-3 flex items-center justify-center gap-2 text-[var(--text-soft)] text-sm">
              <span className="landing-trust-shimmer inline-flex shrink-0 rounded-full">
                <ShieldCheckIcon className="h-4 w-4 text-[var(--blue-soft)]" />
              </span>
              {REFUND_COPY}
            </p>
          </motion.div>
        </div>
      </div>

      <TestimonialsBlock />
    </SectionShell>
  );
}
