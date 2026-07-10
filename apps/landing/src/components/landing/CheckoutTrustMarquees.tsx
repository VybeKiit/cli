'use client';

import { LogoMarqueeRow } from '@/components/landing/LogoMarqueeRow';
import { AI_CODING_AGENTS_STRIP, TECH_TRUST_STRIP } from '@/data/visitorLanding';

/**
 * Dual infinite logo marquees for the checkout dialog — same two rows as the
 * page trust strip, clipped to the dialog’s fixed width. Self-styled (dialog
 * portals outside `.visitor-light`) and hint-free so tooltips never cover copy.
 *
 * @returns Compact dual marquees on a dark trust band.
 * @example
 * <CheckoutTrustMarquees />
 */
export const CheckoutTrustMarquees = () => (
  <div
    aria-label="Tools and AI agents included with VybeKiit"
    className="w-full max-w-full overflow-hidden border-y border-white/10 bg-[#0a0a0b] py-4 text-white"
    role="region"
  >
    <div className="flex w-full flex-col gap-4">
      <LogoMarqueeRow
        ariaLabel={AI_CODING_AGENTS_STRIP.heading}
        compact={true}
        durationDesktop="45s"
        durationMobile="38s"
        marks={AI_CODING_AGENTS_STRIP.marks}
        reverse={true}
        showHints={false}
      />
      <LogoMarqueeRow
        ariaLabel={TECH_TRUST_STRIP.heading}
        compact={true}
        durationDesktop="55s"
        durationMobile="42s"
        marks={TECH_TRUST_STRIP.marks}
        reverse={false}
        showHints={false}
      />
    </div>
  </div>
);
