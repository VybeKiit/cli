'use client';

import { Button } from '@vybekiit/ui/button';
import { VybeKitMark } from '@vybekiit/ui/vybekiit-logo';
import { HEADER_LINKS } from '@/data/nav';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/**
 * Render the top navigation for marketing pages.
 *
 * @returns Localized marketing navigation with the sign-in call to action.
 * @example
 * <SiteHeader />
 */
const SiteHeader = () => {
  const t = useTranslations();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex min-w-0 max-w-[55%] items-center gap-2 font-semibold text-lg sm:max-w-none"
        >
          <VybeKitMark className="h-6 w-6 shrink-0" />
          <span className="truncate">{t('common.productName')}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-4">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
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
};

export { SiteHeader };
