import { Sparkles } from 'lucide-react';
import { type SimpleIcon, siGithub, siInstagram, siX, siYoutube } from 'simple-icons';

import { APP_NAME, FOOTER_COLUMNS } from '@/data/landingContent';

/** Social marks rendered in the footer row, keyed by brand label. */
const SOCIAL_ICONS = [
  { key: 'x', label: 'X', href: 'https://x.com', icon: siX },
  { key: 'instagram', label: 'Instagram', href: 'https://instagram.com', icon: siInstagram },
  { key: 'github', label: 'GitHub', href: 'https://github.com', icon: siGithub },
  { key: 'youtube', label: 'YouTube', href: 'https://youtube.com', icon: siYoutube },
] as const satisfies readonly { key: string; label: string; href: string; icon: SimpleIcon }[];

/**
 * Site footer — brand mark, mapped link columns, social icons, and a copyright line.
 *
 * Link columns come from `FOOTER_COLUMNS` and social marks from `simple-icons`,
 * both rendered via `.map()` rather than pasted siblings.
 *
 * @returns The rendered site footer.
 * @example
 * <SiteFooter />
 */
export const SiteFooter = () => (
  <footer className="border-t border-border bg-background">
    <div className="mx-auto max-w-6xl px-6 py-14 md:px-8">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <a className="flex items-center gap-2 font-semibold" href="#top">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-base">{APP_NAME}</span>
          </a>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Simplify your day and focus on what matters.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.key}>
            <p className="text-sm font-semibold">{column.title}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.key}>
                  <a
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    href={link.href}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {SOCIAL_ICONS.map(({ key, label, href, icon }) => (
            <a
              className="text-muted-foreground transition-colors hover:text-foreground"
              href={href}
              key={key}
            >
              <span className="sr-only">{label}</span>
              <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d={icon.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);
