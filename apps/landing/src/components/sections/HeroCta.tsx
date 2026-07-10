'use client';

import { CheckoutOpenButton } from '@/components/CheckoutOpenButton';
import { TrustChips } from '@/components/TrustChips';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PRICE } from '@/data/site';
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
  const ctaLabel = `${messages.hero.primaryCta} · ${PRICE.display}`;

  return (
    <>
      <CheckoutOpenButton
        location="hero_primary"
        className="w-full px-6 sm:w-auto"
        trackLabel={ctaLabel}
      >
        {messages.hero.primaryCta} · <AnimatedNumber value={PRICE.display} />
      </CheckoutOpenButton>
      <TrustChips />
    </>
  );
};
