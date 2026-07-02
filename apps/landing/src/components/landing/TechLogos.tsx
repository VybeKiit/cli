import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';

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

/** Infinite marquee of the core stack, mono silhouettes on the dark band. */
export function TechLogos() {
  return (
    <AutoScrollRow
      ariaLabel="Built with"
      className="testimonials-logos-marquee"
      durationDesktop="55s"
      durationMobile="38s"
    >
      <ul className="testimonials-logos-row">
        {TESTIMONIAL_LOGOS.map((logo) => (
          <li className="tech-logo" key={logo.slug}>
            <LogoMarkIcon className="h-6 w-6 shrink-0" mono={true} slug={logo.slug} />
            <span className="tech-logo-label">{logo.label}</span>
          </li>
        ))}
      </ul>
    </AutoScrollRow>
  );
}
