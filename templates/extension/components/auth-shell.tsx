import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import type { ReactNode } from 'react';

export interface AuthShellProps {
  titleKey: string;
  descriptionKey: string;
  children: ReactNode;
  onBrandClick?: () => void;
}

export function AuthShell({ titleKey, descriptionKey, children, onBrandClick }: AuthShellProps) {
  return (
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
}
