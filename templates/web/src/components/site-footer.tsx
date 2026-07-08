'use client';

import { FOOTER_LINKS } from '@/data/nav';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/**
 * Render the marketing footer with legal links.
 *
 * @returns Localized footer content for public pages.
 * @example
 * <SiteFooter />
 */
const SiteFooter = () => {
  const t = useTranslations();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>{t('common.footer.copyright', { year })}</p>
        <div className="flex gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};

export { SiteFooter };
