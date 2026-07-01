import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { t } from '@/lib/i18n';
import { requestOpenSidePanel } from '@/lib/sidePanelApi';
import type { ExtensionView } from '@/lib/view';
import { signOut } from '@/lib/authClient';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@vybekiit/client-state';
import { useState } from 'react';

const appUrl = import.meta.env.WXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export function HomeScreen({ onNavigate }: { onNavigate: (view: ExtensionView) => void }) {
  const { user, loading } = useUser();
  const queryClient = useQueryClient();
  const [sidebarPending, setSidebarPending] = useState(false);
  const [message, setMessage] = useState('');

  async function handleOpenSidebar() {
    setSidebarPending(true);
    setMessage('');
    const ok = await requestOpenSidePanel();
    setSidebarPending(false);
    if (!ok) setMessage(t('home_sidebarError'));
  }

  async function handleSignOut() {
    await signOut();
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('home_title')}</CardTitle>
          <CardDescription>{t('home_description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Alert>
            <AlertDescription>{t('popup_backend', appUrl)}</AlertDescription>
          </Alert>
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          {loading ? (
            <p className="text-muted-foreground text-sm">{t('popup_loading')}</p>
          ) : user ? (
            <p className="text-sm">{t('popup_signedInAs', user.email ?? 'you@local.dev')}</p>
          ) : (
            <Button type="button" onClick={() => onNavigate('login')}>
              {t('home_goToLogin')}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={sidebarPending}
            onClick={handleOpenSidebar}
          >
            {sidebarPending ? t('home_openingSidebar') : t('home_openSidebar')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onNavigate('pricing')}>
            {t('home_viewPricing')}
          </Button>
          {user ? (
            <Button type="button" variant="outline" onClick={handleSignOut}>
              {t('home_signOut')}
            </Button>
          ) : null}
          <Button asChild={true} variant="outline">
            <a href={appUrl} target="_blank" rel="noreferrer">
              {t('popup_openWebApp')}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
