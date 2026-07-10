'use client';

import { CheckoutOpenButton } from '@/components/CheckoutOpenButton';
import { TrustChips } from '@/components/TrustChips';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PRICE } from '@/data/site';
import { VISITOR_HERO } from '@/data/visitorLanding';

/**
 * Client-only hero CTA + trust chips (checkout dialog + count-up numbers).
 * Kept separate so the LCP headline can stay in a Server Component.
 *
 * @returns CTA button and trust chips.
 * @example
 * <HeroCta />
 */
export const HeroCta = () => (
  <>
    <CheckoutOpenButton
      location="hero_primary"
      className="w-full px-6 sm:w-auto"
      trackLabel={VISITOR_HERO.primaryCtaLabel}
    >
      Get VybeKiit · <AnimatedNumber value={PRICE.display} />
    </CheckoutOpenButton>
    <TrustChips />
  </>
);
