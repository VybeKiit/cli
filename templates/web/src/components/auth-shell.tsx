'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** Props for {@link AuthShell}. */
export interface AuthShellProps {
  /** Message key for the card heading, e.g. "auth.login.title". */
  titleKey: string;
  /** Message key for the supporting line under the title. */
  descriptionKey: string;
  /** The form (or other body content) rendered inside the card. */
  children: ReactNode;
  /** Optional footer content (links resolved by the page). */
  footer?: ReactNode;
}

/** Centered card layout shared by the sign-in, sign-up, and verify screens. */
export function AuthShell({ titleKey, descriptionKey, children, footer }: AuthShellProps) {
  const t = useTranslations();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Link href="/" className="mb-6 font-semibold text-lg">
        {t('auth.shell.brandLink')}
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t(titleKey)}</CardTitle>
          <CardDescription>{t(descriptionKey)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{children}</CardContent>
      </Card>
      {footer ? <div className="mt-4 text-muted-foreground text-sm">{footer}</div> : null}
    </main>
  );
}
