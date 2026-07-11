import Link from 'next/link';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { VybeBrandMark } from '@/components/ui/CustomIcons';
import { BRAND, FOOTER_LINKS, SUPPORT } from '@/data/site';

interface TechLogo {
  readonly slug: string;
  readonly label: string;
}

/** The core stack shown as social proof in the footer band. */
const FOOTER_TECH_LOGOS: readonly TechLogo[] = [
  { slug: 'nextdotjs', label: 'NEXT.js' },
  { slug: 'tailwindcss', label: 'tailwindcss' },
  { slug: 'supabase', label: 'supabase' },
  { slug: 'stripe', label: 'stripe' },
  { slug: 'openai', label: 'OpenAI' },
  { slug: 'resend', label: 'resend' },
  { slug: 'vercel', label: 'Vercel' },
];

/**
 * Landing footer — tech logos band, logo, copyright, legal links.
 *
 * @returns The rendered Footer element.
 * @example
 * ```tsx
 * <Footer />
 * ```
 */

export const Footer = () => {
  return (
    <footer
      className="relative overflow-hidden border-t-0 pt-[256px] pb-[238px]"
      style={{
        background:
          'radial-gradient(900px 260px at 50% 0%, rgba(55, 65, 85, 0.16), transparent 62%), radial-gradient(700px 220px at 10% 20%, rgba(35, 55, 85, 0.10), transparent 65%), radial-gradient(700px 220px at 90% 20%, rgba(55, 45, 75, 0.10), transparent 65%), #010203',
      }}
    >
      {/* Static tech logos row */}
      <div className="mx-auto flex max-w-[1568px] flex-wrap items-center justify-between gap-12 px-16">
        {FOOTER_TECH_LOGOS.map((logo) => (
          <div className="flex items-center gap-3 opacity-[0.72] grayscale" key={logo.slug}>
            <LogoMarkIcon
              className="h-[38px] w-[38px] shrink-0 brightness-[2.45] contrast-[1.08] text-[rgba(255,255,255,0.56)]"
              mono={true}
              slug={logo.slug}
            />
            <span className="text-2xl font-medium brightness-[2.45] text-[rgba(255,255,255,0.56)]">
              {logo.label}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mx-16 mt-[50px] h-px bg-[rgba(255,255,255,0.12)]" />

      {/* Copyright bar */}
      <div className="mx-[88px] mt-[52px] grid grid-cols-[1fr_auto_1fr] items-center">
        <Link
          className="flex items-center gap-4 justify-self-start text-white transition-opacity hover:opacity-90"
          href="/"
        >
          <VybeBrandMark className="h-10 w-10 shrink-0" />
          <span className="text-4xl font-bold leading-none tracking-tight">{BRAND.name}</span>
        </Link>

        <p className="justify-self-center text-2xl leading-8 text-[rgba(255,255,255,0.58)]">
          © 2024 {BRAND.name}. All rights reserved.
        </p>

        <nav aria-label="Footer" className="flex items-center justify-end gap-16">
          {FOOTER_LINKS.map((link) => (
            <Link
              className="text-2xl leading-8 text-[rgba(255,255,255,0.58)] hover:text-[rgba(255,255,255,0.9)]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="text-2xl leading-8 text-[rgba(255,255,255,0.58)] hover:text-[rgba(255,255,255,0.9)]"
            href="/terms"
          >
            Refund Policy
          </Link>
          <a
            className="text-2xl leading-8 text-[rgba(255,255,255,0.58)] hover:text-[rgba(255,255,255,0.9)]"
            href={`mailto:${SUPPORT.kitEmail}`}
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
};
