import Link from 'next/link';
import { VybeBrandMark } from '@/components/ui/CustomIcons';
import { SectionShell } from '@/components/ui/SectionShell';
import { BRAND, FOOTER_LINKS, SUPPORT } from '@/data/site';

/** Landing footer — logo, copyright, legal links. */
export function Footer() {
  return (
    <footer className="border-white/8 border-t py-[72px]">
      <SectionShell>
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:gap-[72px]">
          <Link
            className="footer-brand-lockup flex items-center gap-2 text-white transition-opacity hover:opacity-90"
            href="/"
          >
            <VybeBrandMark className="h-[18px] w-[18px] shrink-0" />
            <span className="font-semibold text-sm tracking-tight">{BRAND.name}</span>
          </Link>

          <p className="text-[var(--text-muted)] text-sm">
            © 2026 {BRAND.name}. All rights reserved.
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
