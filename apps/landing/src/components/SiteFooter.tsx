import Link from 'next/link';
import { VybeLogoIcon } from '@/components/ui/CustomIcons';
import { BRAND, FOOTER_LINKS, SUPPORT } from '@/data/site';

/** Calendar year for the copyright line (re-evaluated each SSR/build). */
const COPYRIGHT_YEAR = new Date().getFullYear();

/**
 * Store footer — brand tagline, legal links, Discord + email, and copyright year.
 *
 * @returns The rendered store footer.
 * @example
 * <SiteFooter />
 */
export const SiteFooter = () => (
  <footer className="border-border/60 border-t">
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="inline-flex items-center gap-2 font-semibold text-base text-foreground tracking-tight">
          <VybeLogoIcon className="size-7 shrink-0 text-foreground" />
          <span>{BRAND.name}</span>
        </p>
        <p className="mt-1 max-w-sm text-muted-foreground text-sm">{BRAND.tagline}</p>
        <p className="mt-3 text-muted-foreground text-sm">
          © {COPYRIGHT_YEAR} {BRAND.name}. All rights reserved.
        </p>
      </div>
      <div className="flex flex-col items-start gap-4 sm:items-end">
        <nav aria-label="Legal" className="flex flex-wrap gap-4 text-muted-foreground text-sm">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav
          aria-label="Contact"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm"
        >
          {SUPPORT.discordUrl.length > 0 ? (
            <a
              className="transition-colors hover:text-foreground"
              href={SUPPORT.discordUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Discord
            </a>
          ) : null}
          <a
            className="transition-colors hover:text-foreground"
            href={`mailto:${SUPPORT.kitEmail}`}
          >
            {SUPPORT.kitEmail}
          </a>
        </nav>
      </div>
    </div>
  </footer>
);
