import { Button } from '@/components/ui/button';
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

const configuredUiLibraryUrl = import.meta.env.WXT_PUBLIC_UI_LIBRARY_URL;
const uiLibraryUrl =
  configuredUiLibraryUrl === undefined || configuredUiLibraryUrl.length === 0
    ? 'http://localhost:3002'
    : configuredUiLibraryUrl;

const FEATURES = [
  'popup_marketing_pill_web',
  'popup_marketing_pill_mobile',
  'popup_marketing_pill_extension',
  'popup_marketing_pill_ui',
] as const;

interface PopupMarketingScreenProps {
  readonly onNavigate: (view: ExtensionView) => void;
}

/**
 * Render the marketing-first popup screen.
 *
 * @param props - Navigation callback for changing extension views.
 * @returns The popup marketing screen.
 * @example
 * <PopupMarketingScreen onNavigate={setView} />
 */
export const PopupMarketingScreen = ({ onNavigate }: PopupMarketingScreenProps) => {
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
    <div className="vk-popup-marketing relative flex min-h-full flex-col">
      <div
        aria-hidden="true"
        className="vk-popup-marketing-bg pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="vk-popup-marketing-flare pointer-events-none absolute inset-x-0 top-0 h-24"
      />

      <header className="relative z-10 px-1 pt-1">
        <p className="vk-popup-eyebrow">{t('popup_marketing_eyebrow')}</p>
        <h1 className="vk-popup-headline mt-3">
          <span className="block">{t('popup_marketing_headline_1')}</span>
          <span className="vk-popup-headline-accent block">{t('popup_marketing_headline_2')}</span>
        </h1>
        <p className="vk-popup-subhead mt-3">{t('popup_marketing_subhead')}</p>
      </header>

      <ul className="relative z-10 mt-5 grid grid-cols-2 gap-2">
        {FEATURES.map((key) => (
          <li className="vk-popup-pill" key={key}>
            {t(key)}
          </li>
        ))}
      </ul>

      {message ? <p className="relative z-10 mt-4 text-destructive text-xs">{message}</p> : null}

      <div className="relative z-10 mt-auto flex flex-col gap-2 pt-6">
        {loading ? (
          <p className="text-[#8b95a7] text-xs">{t('popup_loading')}</p>
        ) : user ? (
          <p className="text-[#8b95a7] text-xs">{t('popup_signedInAs', userEmail)}</p>
        ) : null}

        <Button
          className="vk-popup-cta w-full"
          disabled={sidebarPending}
          type="button"
          onClick={handleOpenSidebar}
        >
          {sidebarPending ? t('home_openingSidebar') : t('popup_marketing_cta_sidebar')}
        </Button>

        {user ? (
          <Button
            className="vk-popup-cta-secondary w-full"
            type="button"
            variant="outline"
            onClick={handleSignOut}
          >
            {t('home_signOut')}
          </Button>
        ) : (
          <Button
            className="vk-popup-cta-secondary w-full"
            type="button"
            variant="outline"
            onClick={handleLoginClick}
          >
            {t('home_goToLogin')}
          </Button>
        )}

        <Button
          asChild={true}
          className="vk-popup-cta-secondary w-full"
          type="button"
          variant="outline"
        >
          <a href={uiLibraryUrl} rel="noreferrer" target="_blank">
            {t('popup_marketing_cta_uiLibrary')}
          </a>
        </Button>

        <Button
          asChild={true}
          className="vk-popup-cta-secondary w-full"
          type="button"
          variant="outline"
        >
          <a href={appUrl} rel="noreferrer" target="_blank">
            {t('popup_openWebApp')}
          </a>
        </Button>

        <Button
          className="vk-popup-cta-secondary w-full"
          type="button"
          variant="outline"
          onClick={handlePricingClick}
        >
          {t('home_viewPricing')}
        </Button>
      </div>
    </div>
  );
};
