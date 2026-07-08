import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import type { ReactNode } from 'react';

export interface AuthShellProps {
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly children?: ReactNode;
  readonly onBrandClick?: () => void;
}

/**
 * Shared authentication card shell.
 *
 * @param props - Message keys, child form content, and optional brand click handler.
 * @returns The authentication layout.
 * @example
 * <AuthShell titleKey="auth_login_title" descriptionKey="auth_login_description" />
 */
export const AuthShell = ({
  titleKey,
  descriptionKey,
  children = null,
  onBrandClick,
}: AuthShellProps) => (
  <div className="flex flex-col gap-4 py-2">
    <button
      type="button"
      className="self-center font-semibold text-base hover:underline"
      onClick={onBrandClick}
    >
      {t('auth_shell_brand')}
    </button>
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{t(titleKey)}</CardTitle>
        <CardDescription>{t(descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  </div>
);
