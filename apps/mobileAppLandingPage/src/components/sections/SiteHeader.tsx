'use client';

import { Button } from '@vybekiit/ui/button';
import { Menu, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { APP_NAME, HEADER_CTA, NAV_LINKS } from '@/data/landingContent';
import { cn } from '@/lib/utils';

/**
 * Sticky top navigation: brand logo, mapped nav links, and a primary download CTA.
 *
 * The mobile hamburger toggles an inline link panel via `useState`, so this leaf is
 * a client component; the links themselves come from the `NAV_LINKS` data array.
 *
 * @returns The rendered site header.
 * @example
 * <SiteHeader />
 */
export const SiteHeader = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleMenu = (): void => {
    setIsOpen((previous) => !previous);
  };

  const handleCloseMenu = (): void => {
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-8">
        <a className="flex items-center gap-2 font-semibold" href="#top">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base">{APP_NAME}</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={link.href}
              key={link.key}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild={true} size="sm">
            <a href={HEADER_CTA.href}>{HEADER_CTA.label}</a>
          </Button>
        </div>

        <Button
          aria-expanded={isOpen}
          aria-label="Toggle menu"
          className="md:hidden"
          onClick={handleToggleMenu}
          size="icon"
          variant="ghost"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className={cn('border-t border-border md:hidden', isOpen ? 'block' : 'hidden')}>
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4">
          {NAV_LINKS.map((link) => (
            <a
              className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href={link.href}
              key={link.key}
              onClick={handleCloseMenu}
            >
              {link.label}
            </a>
          ))}
          <Button asChild={true} className="mt-2 w-full" size="sm">
            <a href={HEADER_CTA.href} onClick={handleCloseMenu}>
              {HEADER_CTA.label}
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
};
