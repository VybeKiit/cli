'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { BRAND, NAV_LINKS, PRIMARY_CTA } from '@/data/landingContent';
import { cn } from '@/lib/utils';

/**
 * Sticky top navigation — brand logo + "Browser Extension" badge, mapped nav
 * links, and the primary "Add to Chrome" CTA. Collapses to a hamburger toggle
 * on mobile; `'use client'` for the open/close state.
 *
 * @returns The rendered site header.
 * @example
 * <SiteHeader />
 */
export const SiteHeader = () => {
  const [open, setOpen] = useState(false);

  const closeMenu = (): void => {
    setOpen(false);
  };

  const toggleMenu = (): void => {
    setOpen((previous) => !previous);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-10">
        <a className="flex items-center gap-2" href="#top">
          <BrandLogo />
          <span className="font-semibold text-base">{BRAND.name}</span>
          <Badge className="hidden font-medium sm:inline-flex" variant="secondary">
            {BRAND.tagline}
          </Badge>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild={true} className="hidden md:inline-flex" size="sm">
            <a href={PRIMARY_CTA.href}>{PRIMARY_CTA.label}</a>
          </Button>
          <Button
            aria-expanded={open}
            aria-label="Toggle navigation menu"
            className="md:hidden"
            onClick={toggleMenu}
            size="icon"
            variant="ghost"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      <div className={cn('border-t md:hidden', open ? 'block' : 'hidden')}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-3">
          {NAV_LINKS.map((link) => (
            <a
              className="rounded-md px-2 py-2 font-medium text-muted-foreground text-sm hover:bg-muted hover:text-foreground"
              href={link.href}
              key={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
          <Button asChild={true} className="mt-2 w-full">
            <a href={PRIMARY_CTA.href} onClick={closeMenu}>
              {PRIMARY_CTA.label}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};
