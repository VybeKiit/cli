'use client';

import { VybeLogoIcon } from '@/components/ui/CustomIcons';
import { LANDING_EASE, LANDING_HERO, LANDING_NAV } from '@/data/landing';
import { BRAND } from '@/data/site';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

/** Fixed header with nav anchors and checkout CTA. */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      animate={{ opacity: 1, y: 0 }}
      className="relative z-50"
      initial={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.7, ease: LANDING_EASE }}
    >
      <div className="mx-auto flex h-[96px] max-w-[1520px] items-center justify-between px-6 md:px-12">
        <Link className="flex items-center gap-3 text-white" href="/">
          <VybeLogoIcon className="h-8 w-8" />
          <span className="font-extrabold text-[22px] tracking-tight">{BRAND.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-11 lg:flex">
          {LANDING_NAV.map((link) => (
            <a
              className="font-semibold text-[var(--text-soft)] text-sm transition-colors hover:text-white hover:underline hover:decoration-[var(--blue)] hover:underline-offset-4"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            className="landing-cta-pill hidden px-6 py-3 font-semibold text-sm sm:inline-flex"
            href="/checkout"
          >
            {LANDING_HERO.ctaLabel}
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            type="button"
          >
            <span className="sr-only">Menu</span>
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 7 H20 M4 12 H20 M4 17 H20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className={cn(
          'border-white/10 border-t bg-[var(--bg-soft)]/95 px-6 py-4 backdrop-blur lg:hidden',
          menuOpen ? 'block' : 'hidden',
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col gap-3">
          {LANDING_NAV.map((link) => (
            <a
              className="text-[var(--text-soft)] hover:text-white"
              href={link.href}
              key={link.label}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            className="landing-cta-pill mt-2 inline-flex w-fit px-6 py-3 font-semibold text-sm"
            href="/checkout"
          >
            {LANDING_HERO.ctaLabel}
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
