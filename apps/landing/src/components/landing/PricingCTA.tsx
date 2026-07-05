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
    <SectionShell className="pt-[132px] pb-[110px]" id="pricing">
      <div className="pricing-panel blue-top-glow overflow-hidden">
        <div className="grid gap-10 lg:grid-cols-[640px_1fr] lg:gap-[92px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            onAnimationComplete={() => setPriceColumnReady(true)}
            transition={{ duration: 0.75 }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <PricingOfferPeek dropped={priceDropped} />
            <PricingHeroPrice countdownStart={priceColumnReady} onDropped={handlePriceDropped} />
            <ul className="mt-8 space-y-[22px]">
              {PRICING_BULLETS.map((bullet) => (
                <li
                  className="flex items-start gap-6 text-[29px] leading-[1.25] text-[rgba(226,232,240,0.88)]"
                  key={bullet}
                >
                  <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#60a5fa] text-[#06101e]">
                    <CheckCircleIcon className="h-5 w-5" />
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="flex flex-col justify-start"
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <CheckoutCTA icon="lock" size="pricing">
              Get VybeKiit Now
            </CheckoutCTA>
            <p className="mt-[70px] text-center text-[32px] font-medium leading-[1.25] text-white">
              One payment. Lifetime access.
            </p>
            <p className="mt-[84px] flex items-center justify-center gap-7 text-[32px] leading-[1.2] text-white">
              <span className="landing-trust-shimmer inline-flex shrink-0 rounded-full">
                <ShieldCheckIcon className="h-[46px] w-[46px] text-[var(--blue-soft)]" />
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
