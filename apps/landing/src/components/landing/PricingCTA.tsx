'use client';

import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { PricingCheckoutTerminal } from '@/components/landing/PricingCheckoutTerminal';
import { PricingHeroPrice } from '@/components/landing/PricingHeroPrice';
import { PricingOfferPeek } from '@/components/landing/PricingOfferPeek';
import { TestimonialsBlock } from '@/components/landing/TestimonialsBlock';
import { CheckoutCTA } from '@/components/ui/CheckoutCTA';
import { CheckCircleIcon, ShieldCheckIcon } from '@/components/ui/CustomIcons';
import { SectionShell } from '@/components/ui/SectionShell';
import { PRICING_BULLETS } from '@/data/landing';

const REFUND_COPY = '14-day refund, no questions asked.';

/** Pricing CTA section with $29 offer; testimonials block sits below the panel. */
export function PricingCTA() {
  const [priceColumnReady, setPriceColumnReady] = useState(false);
  const [priceDropped, setPriceDropped] = useState(false);

  const handlePriceDropped = useCallback(() => setPriceDropped(true), []);

  return (
    <SectionShell className="py-16 md:py-24" id="pricing">
      <div className="pricing-panel blue-top-glow overflow-hidden">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            onAnimationComplete={() => setPriceColumnReady(true)}
            transition={{ duration: 0.75 }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <PricingOfferPeek dropped={priceDropped} />
            <PricingHeroPrice countdownStart={priceColumnReady} onDropped={handlePriceDropped} />
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
            <PricingCheckoutTerminal />
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
