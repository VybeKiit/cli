'use client';

import { Button } from '@vybekiit/ui/button';
import { HEADER_LINKS } from '@/data/nav';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/** Top navigation for marketing pages. Logical spacing mirrors under RTL. */
export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-lg">
          {t('common.productName')}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Button asChild={true} size="sm">
            <Link href="/login">{t('common.nav.signIn')}</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
