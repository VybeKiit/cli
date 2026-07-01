'use client';

import { SiteFooter } from '@/components/site-footer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Link, useRouter } from '@/i18n/navigation';
import { signOut } from '@/lib/authClient';
import type { AuthUser } from '@vybekiit/auth';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

/** Signed-in chrome: brand, avatar menu with sign-out, then page content + footer. */
export function DashboardShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const t = useTranslations();
  const initials = (user.email ?? t('common.fallback.user')).slice(0, 2).toUpperCase();

  async function handleSignOut() {
    setPending(true);
    await signOut();
    router.push('/login');
  }

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
                <span className="hidden text-sm sm:inline">
                  {user.email ?? t('common.fallback.signedIn')}
                </span>
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
}
