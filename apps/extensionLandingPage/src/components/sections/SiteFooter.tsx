import { BrandLogo } from '@/components/ui/BrandLogo';
import { resolveIcon } from '@/components/ui/IconRegistry';
import { BRAND, FOOTER_COPYRIGHT, FOOTER_LINKS, SOCIAL_LINKS } from '@/data/landingContent';

/**
 * Site footer — brand mark + copyright, the mapped footer link row, and the
 * mapped social-icon row (all driven by data arrays, never pasted siblings).
 *
 * @returns The rendered site footer.
 * @example
 * <SiteFooter />
 */
export const SiteFooter = () => (
  <footer className="border-t" id="support">
    <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-6 py-10 md:flex-row md:justify-between md:px-10">
      <div className="flex flex-col items-center gap-2 md:items-start">
        <div className="flex items-center gap-2">
          <BrandLogo />
          <span className="font-semibold text-base">{BRAND.name}</span>
        </div>
        <p className="text-muted-foreground text-sm">{FOOTER_COPYRIGHT}</p>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {FOOTER_LINKS.map((link) => (
          <a
            className="text-muted-foreground text-sm transition-colors hover:text-foreground"
            href={link.href}
            key={link.key}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {SOCIAL_LINKS.map((social) => {
          const Icon = resolveIcon(social.icon);
          return (
            <a
              aria-label={social.label}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              href={social.href}
              key={social.key}
            >
              <Icon className="h-4 w-4" />
            </a>
          );
        })}
      </div>
    </div>
  </footer>
);
