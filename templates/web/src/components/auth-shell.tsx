'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

/** Props for {@link AuthShell}. */
interface AuthShellProps {
  /** Message key for the card heading, e.g. "auth.login.title". */
  readonly titleKey: string;
  /** Message key for the supporting line under the title. */
  readonly descriptionKey: string;
  /** The form (or other body content) rendered inside the card. */
  readonly children?: ReactNode;
  /** Optional footer content (links resolved by the page). */
  readonly footer?: ReactNode;
}

/**
 * Render the centered auth card shared by sign-in, sign-up, and verify screens.
 *
 * @param props - Translation keys plus optional body and footer content.
 * @returns Auth screen shell.
 * @example
 * <AuthShell titleKey="auth.login.title" descriptionKey="auth.login.description" />
 */
const AuthShell = ({
  titleKey,
  descriptionKey,
  children = null,
  footer = null,
}: AuthShellProps) => {
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
};

export { AuthShell };
export type { AuthShellProps };
