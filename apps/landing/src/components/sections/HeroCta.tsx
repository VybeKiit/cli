'use client';

import { CheckoutOpenButton } from '@/components/CheckoutOpenButton';
import { useLivePricing } from '@/components/LivePricingProvider';
import { TrustChips } from '@/components/TrustChips';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useLandingLocale } from '@/i18n/LocaleProvider';

/**
 * Client-only hero CTA + trust chips (checkout dialog + count-up numbers).
 *
 * @returns CTA button and trust chips.
 * @example
 * <HeroCta />
 */
export const HeroCta = () => {
  const { messages } = useLandingLocale();
  const { pricing: live } = useLivePricing();
  const ctaLabel = `${messages.hero.primaryCta} · ${live.display}`;

  return (
    <>
      <CheckoutOpenButton
        location="hero_primary"
        className="w-full px-6 sm:w-auto"
        trackLabel={ctaLabel}
      >
        {messages.hero.primaryCta} · <AnimatedNumber value={live.display} />
      </CheckoutOpenButton>
      <TrustChips />
    </>
  );
};
