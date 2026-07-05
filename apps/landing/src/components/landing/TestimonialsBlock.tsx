import { TechLogos } from '@/components/landing/TechLogos';
import { SOCIAL_PROOF } from '@/data/landing';

const STARS = Array.from({ length: 5 });

/** Social proof below the pricing panel — stars, tagline, official tech logos. */
export function TestimonialsBlock() {
  return (
    <div
      className="testimonials-block pt-[150px] pb-[235px] text-center"
      style={{
        background:
          'radial-gradient(ellipse 78% 54% at 50% 42%, rgba(255,255,255,0.105) 0%, rgba(255,255,255,0.055) 28%, rgba(255,255,255,0.022) 48%, transparent 72%), #020303',
      }}
    >
      <div aria-hidden="true" className="testimonials-stars">
        {STARS.map((_, index) => (
          <span key={index}>★</span>
        ))}
      </div>
      <p className="testimonials-tagline">{SOCIAL_PROOF.tagline}</p>
      <p className="testimonials-subtagline">{SOCIAL_PROOF.subtagline}</p>
      <div className="mt-[72px]">
        <TechLogos />
      </div>
    </div>
  );
}
