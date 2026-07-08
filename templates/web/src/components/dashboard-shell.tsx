'use client';

import { SiteFooter } from '@/components/site-footer';
import { SaasIcon } from '@/components/saas-page-view';
import { DASHBOARD_NAV_LINKS } from '@/data/saasPages';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { Avatar, AvatarFallback } from '@vybekiit/ui/avatar';
import { Button } from '@vybekiit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vybekiit/ui/dropdown-menu';
import { Separator } from '@vybekiit/ui/separator';
import { signOut } from '@/lib/authClient';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@vybekiit/auth';
import { useTranslations } from 'next-intl';
import { type ReactNode, useCallback, useState } from 'react';

interface DashboardShellProps {
  readonly user: AuthUser;
  readonly children?: ReactNode;
}

/**
 * Render signed-in chrome with brand navigation, avatar menu, content, and footer.
 *
 * @param props - Signed-in user plus page content.
 * @returns The authenticated app shell.
 * @example
 * <DashboardShell user={user}><DashboardPage /></DashboardShell>
 */
export const DashboardShell = ({ user, children = null }: DashboardShellProps) => {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const userEmail =
    user.email === null || user.email === '' ? t('common.fallback.user') : user.email;
  const displayEmail =
    user.email === null || user.email === '' ? t('common.fallback.signedIn') : user.email;
  const initials = userEmail.slice(0, 2).toUpperCase();

  const handleSignOut = useCallback(async () => {
    setPending(true);
    await signOut();
    router.push('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-semibold text-lg">
            {t('common.productName')}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild={true}>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm sm:inline">{displayEmail}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={pending} onClick={handleSignOut}>
                {t('auth.dashboard.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Separator />
      </header>
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-6 py-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav
            aria-label="Workspace navigation"
            className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2 lg:flex-col lg:overflow-visible"
          >
            {DASHBOARD_NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 font-medium text-sm transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <SaasIcon name={link.icon} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
};
