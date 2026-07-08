import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { signOut } from '@/lib/authClient';
import { t } from '@/lib/i18n';
import { requestOpenSidePanel } from '@/lib/sidePanelApi';
import type { ExtensionView } from '@/lib/view';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@vybekiit/client-state';
import { Effect, Either } from 'effect';
import { useState } from 'react';

const configuredAppUrl = import.meta.env.WXT_PUBLIC_APP_URL;
const appUrl =
  configuredAppUrl === undefined || configuredAppUrl.length === 0
    ? 'http://localhost:3000'
    : configuredAppUrl;

interface HomeScreenProps {
  readonly onNavigate: (view: ExtensionView) => void;
}

/**
 * Render the signed-in extension home screen.
 *
 * @param props - Navigation callback for changing extension views.
 * @returns The extension home screen.
 * @example
 * <HomeScreen onNavigate={setView} />
 */
export const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const { user, loading } = useUser();
  const queryClient = useQueryClient();
  const [sidebarPending, setSidebarPending] = useState(false);
  const [message, setMessage] = useState('');

  const handleOpenSidebar = async (): Promise<void> => {
    setSidebarPending(true);
    setMessage('');
    const ok = await requestOpenSidePanel();
    setSidebarPending(false);
    if (!ok) {
      setMessage(t('home_sidebarError'));
    }
  };

  const handleSignOut = async (): Promise<void> => {
    const result = await Effect.runPromise(Effect.either(signOut()));
    if (Either.isLeft(result)) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
  };

  const handleLoginClick = (): void => onNavigate('login');
  const handlePricingClick = (): void => onNavigate('pricing');
  const userEmail = user === null || user.email === null ? 'you@local.dev' : user.email;

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
            <p className="text-sm">{t('popup_signedInAs', userEmail)}</p>
          ) : (
            <Button type="button" onClick={handleLoginClick}>
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
          <Button type="button" variant="outline" onClick={handlePricingClick}>
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
};
