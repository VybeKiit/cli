import { TechLogos } from '@/components/landing/TechLogos';
import { SOCIAL_PROOF } from '@/data/landing';

const STARS = Array.from({ length: 5 });

/** Social proof below the pricing panel — stars, tagline, official tech logos. */
export function TestimonialsBlock() {
  return (
    <div className="testimonials-block mt-16 text-center md:mt-[64px]">
      <div aria-hidden="true" className="testimonials-stars">
        {STARS.map((_, index) => (
          <span key={index}>★</span>
        ))}
      </div>
      <p className="testimonials-tagline">{SOCIAL_PROOF.tagline}</p>
      <p className="testimonials-subtagline">{SOCIAL_PROOF.subtagline}</p>
      <TechLogos />
    </div>
  );
}
