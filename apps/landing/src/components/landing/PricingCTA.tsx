import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { PricingHeroPrice } from '@/components/landing/PricingHeroPrice';
import { PricingOfferPeek } from '@/components/landing/PricingOfferPeek';
import { TestimonialsBlock } from '@/components/landing/TestimonialsBlock';
import { CheckoutCTA } from '@/components/ui/CheckoutCTA';
import { CheckCircleIcon, ShieldCheckIcon } from '@/components/ui/CustomIcons';
import { PRICING_BULLETS, SOCIAL_PROOF } from '@/data/landing';

const REFUND_COPY = '14-day refund, no questions asked.';
const STARS = Array.from({ length: 5 });
const PRICING_STACK_LOGOS = [
  { slug: 'nextdotjs', label: 'NEXT.js' },
  { slug: 'tailwindcss', label: 'tailwindcss' },
  { slug: 'supabase', label: 'supabase' },
  { slug: 'stripe', label: 'stripe' },
  { slug: 'openai', label: 'OpenAI' },
  { slug: 'resend', label: 'resend' },
  { slug: 'vercel', label: 'Vercel' },
] as const;

/**
 * Pricing CTA section with $29 offer; testimonials block sits below the panel.
 *
 * @returns The rendered PricingCTA element.
 * @example
 * ```tsx
 * <PricingCTA />
 * ```
 */

export const PricingCTA = () => (
  <section className="relative w-full pt-[132px] pb-[110px]" id="pricing">
    <div className="pricing-panel blue-top-glow overflow-hidden">
      <div className="grid gap-10 lg:grid-cols-[640px_1fr] lg:gap-[40px]">
        <div>
          <PricingOfferPeek />
          <PricingHeroPrice />
          <ul className="mt-8 space-y-[22px]">
            {PRICING_BULLETS.map((bullet) => (
              <li
                className="flex items-start gap-6 text-3xl leading-[1.25] text-[rgba(226,232,240,0.88)]"
                key={bullet}
              >
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#60a5fa] text-[#06101e]">
                  <CheckCircleIcon className="h-5 w-5" />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-start pt-[24px]">
          <CheckoutCTA icon="lock" size="pricing">
            Get VybeKiit Now
          </CheckoutCTA>
          <p className="mt-[76px] text-center text-4xl font-medium leading-[1.25] text-white">
            One payment. Lifetime access.
          </p>
          <p className="mt-[84px] flex items-center justify-center gap-7 text-4xl leading-[1.2] text-white">
            <span className="landing-trust-shimmer inline-flex shrink-0 rounded-full">
              <ShieldCheckIcon className="h-[46px] w-[46px] text-[var(--blue-soft)]" />
            </span>
            {REFUND_COPY}
          </p>
        </div>
      </div>

      <div className="pricing-panel-proof">
        <div className="pricing-panel-proof-stars" aria-hidden="true">
          {STARS.map((_, index) => (
            <span key={index}>★</span>
          ))}
        </div>
        <p>{SOCIAL_PROOF.tagline}</p>
        <p>{SOCIAL_PROOF.subtagline}</p>
        <ul className="pricing-panel-logo-row" aria-label="Built with">
          {PRICING_STACK_LOGOS.map((logo) => (
            <li key={logo.slug}>
              <LogoMarkIcon className="h-[28px] w-[28px] shrink-0" mono={true} slug={logo.slug} />
              <span>{logo.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <TestimonialsBlock />
  </section>
);
