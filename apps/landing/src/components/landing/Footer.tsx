import Link from 'next/link';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { VybeBrandMark } from '@/components/ui/CustomIcons';
import { SectionShell } from '@/components/ui/SectionShell';
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

/** Landing footer — tech logos band, logo, copyright, legal links. */
export function Footer() {
  return (
    <footer className="border-white/8 border-t py-[72px]">
      <SectionShell>
        {/* Static tech logos row */}
        <div className="flex flex-wrap items-center justify-center gap-14 pb-12 md:gap-20">
          {FOOTER_TECH_LOGOS.map((logo) => (
            <div className="flex items-center gap-2 opacity-50" key={logo.slug}>
              <LogoMarkIcon className="h-7 w-7 shrink-0" mono={true} slug={logo.slug} />
              <span className="text-[var(--text-muted)] text-base font-medium">{logo.label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-white/8 border-t" />

        {/* Copyright bar */}
        <div className="flex flex-col items-center justify-between gap-8 pt-8 md:flex-row md:gap-[72px]">
          <Link
            className="footer-brand-lockup flex items-center gap-2 text-white transition-opacity hover:opacity-90"
            href="/"
          >
            <VybeBrandMark className="h-[18px] w-[18px] shrink-0" />
            <span className="font-semibold text-sm tracking-tight">{BRAND.name}</span>
          </Link>

          <p className="text-[var(--text-muted)] text-sm">
            © 2024 {BRAND.name}. All rights reserved.
          </p>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                className="text-[var(--text-soft)] text-sm hover:text-white"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
            <Link className="text-[var(--text-soft)] text-sm hover:text-white" href="/terms">
              Refund Policy
            </Link>
            <a
              className="text-[var(--text-soft)] text-sm hover:text-white"
              href={`mailto:${SUPPORT.kitEmail}`}
            >
              Contact
            </a>
          </nav>
        </div>
      </SectionShell>
    </footer>
  );
}
