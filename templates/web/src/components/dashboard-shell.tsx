'use client';

import { SiteFooter } from '@/components/site-footer';
import { Avatar, AvatarFallback } from '@vybekiit/ui/avatar';
import { Button } from '@vybekiit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vybekiit/ui/dropdown-menu';
import { Separator } from '@vybekiit/ui/separator';
import { Link, useRouter } from '@/i18n/navigation';
import { signOut } from '@/lib/authClient';
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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
};
