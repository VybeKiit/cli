'use client';

import { TechLogos } from '@/components/landing/TechLogos';
import { TypewriterSequence } from '@/components/ui/TypewriterSequence';
import { SOCIAL_PROOF } from '@/data/landing';

const STARS = Array.from({ length: 5 });

/** Social proof below the pricing panel — stars, tagline, official tech logos. */
export function TestimonialsBlock() {
  return (
    <div className="testimonials-block mt-16 text-center md:mt-[64px]">
      <div aria-hidden="true" className="testimonials-stars">
        {STARS.map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>

      <TypewriterSequence
        lines={[
          { text: SOCIAL_PROOF.tagline, as: 'p', className: 'testimonials-tagline' },
          { text: SOCIAL_PROOF.subtagline, as: 'p', className: 'testimonials-subtagline' },
        ]}
      />

      <TechLogos />
    </div>
  );
}
