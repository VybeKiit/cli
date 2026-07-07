import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';

interface TechLogo {
  readonly slug: string;
  readonly label: string;
}

/** The core stack shown as social proof — the marks in the design. */
const TESTIMONIAL_LOGOS: readonly TechLogo[] = [
  { slug: 'nextdotjs', label: 'NEXT.js' },
  { slug: 'tailwindcss', label: 'tailwindcss' },
  { slug: 'supabase', label: 'supabase' },
  { slug: 'stripe', label: 'stripe' },
  { slug: 'openai', label: 'OpenAI' },
  { slug: 'resend', label: 'resend' },
  { slug: 'vercel', label: 'Vercel' },
];

/**
 * Static core stack row, matching the target landing mock.
 *
 * @returns The rendered TechLogos element.
 * @example
 * ```tsx
 * <TechLogos />
 * ```
 */

export const TechLogos = () => (
  <div aria-label="Built with" className="testimonials-logos-marquee" role="group">
    <ul className="testimonials-logos-row">
      {TESTIMONIAL_LOGOS.map((logo) => (
        <li className="tech-logo" key={logo.slug}>
          <LogoMarkIcon className="h-9 w-9 shrink-0" mono={true} slug={logo.slug} />
          <span className="tech-logo-label">{logo.label}</span>
        </li>
      ))}
    </ul>
  </div>
);
