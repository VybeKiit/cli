'use client';

import { useEffect, useState } from 'react';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { CheckoutOpenButton } from '@/components/CheckoutOpenButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VybeLogoIcon } from '@/components/ui/CustomIcons';
import { BRAND, HEADER_LINKS } from '@/data/site';
import { cn } from '@/lib/utils';

/**
 * Sticky top navigation for every visitor store page.
 * Desktop (md+): links + theme toggle + CTA. Mobile: animated hamburger drawer only.
 * Get VybeKiit opens the checkout dialog without leaving the page.
 *
 * @returns The rendered store header.
 * @example
 * <SiteHeader />
 */
export const SiteHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Close the drawer if the viewport grows into desktop while open.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (media.matches) {
        setMenuOpen(false);
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <TrackedLink
          href="/"
          location="nav"
          trackProperties={{ label: BRAND.name }}
          className="inline-flex items-center gap-2 font-semibold text-base text-foreground tracking-tight"
        >
          <VybeLogoIcon className="size-7 shrink-0 text-foreground" />
          <span>{BRAND.name}</span>
        </TrackedLink>

        <div className="flex items-center gap-1 sm:gap-3">
          <div className="hidden items-center gap-5 md:flex">
            {HEADER_LINKS.map((link) => (
              <TrackedLink
                key={link.href}
                href={link.href}
                location="nav"
                trackProperties={{ label: link.label }}
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                {link.label}
              </TrackedLink>
            ))}
          </div>

          <ThemeToggle />

          <CheckoutOpenButton
            location="header"
            size="sm"
            className="hidden px-4 md:inline-flex"
            trackLabel="Get VybeKiit"
          >
            Get VybeKiit
          </CheckoutOpenButton>

          <button
            aria-controls="site-mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className={cn('nav-hamburger inline-flex md:hidden', menuOpen && 'nav-hamburger--open')}
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span className="nav-hamburger-line" />
            <span className="nav-hamburger-line" />
            <span className="nav-hamburger-line" />
          </button>
        </div>
      </nav>

      <div
        aria-hidden={!menuOpen}
        className={cn('nav-mobile-panel md:hidden', menuOpen && 'nav-mobile-panel--open')}
        id="site-mobile-nav"
      >
        <div className="nav-mobile-panel-inner mx-auto flex max-w-5xl flex-col gap-1 px-6 pb-5">
          {HEADER_LINKS.map((link) => (
            <TrackedLink
              key={link.href}
              href={link.href}
              location="nav"
              trackProperties={{ label: link.label }}
              className="rounded-lg px-3 py-2.5 text-foreground text-sm transition-colors hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </TrackedLink>
          ))}
          <CheckoutOpenButton
            location="header"
            size="sm"
            className="mt-2 w-full"
            trackLabel="Get VybeKiit"
            onClick={() => setMenuOpen(false)}
          >
            Get VybeKiit
          </CheckoutOpenButton>
        </div>
      </div>
    </header>
  );
};
