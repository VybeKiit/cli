import { AppShell } from '@/components/app-shell';
import { HomeScreen } from '@/components/screens/home-screen';
import { PopupMarketingScreen } from '@/components/screens/popup-marketing-screen';
import { LoginScreen } from '@/components/screens/login-screen';
import { PricingScreen } from '@/components/screens/pricing-screen';
import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import type { ExtensionSurface, ExtensionView } from '@/lib/view';
import { useState } from 'react';

interface AppRootProps {
  readonly surface: ExtensionSurface;
}

/**
 * Root extension router shared by popup and side panel entrypoints.
 *
 * @param props - Extension surface being rendered.
 * @returns The active extension screen wrapped in the shared shell.
 * @example
 * <AppRoot surface="popup" />
 */
export const AppRoot = ({ surface }: AppRootProps) => {
  const [view, setView] = useState<ExtensionView>('home');
  const isPopup = surface === 'popup';

  return (
    <>
      <ReportModeDev />
      <AppShell surface={surface} view={view} onViewChange={setView}>
        {view === 'home' && isPopup ? <PopupMarketingScreen onNavigate={setView} /> : null}
        {view === 'home' && !isPopup ? <HomeScreen onNavigate={setView} /> : null}
        {view === 'login' ? <LoginScreen onNavigate={setView} /> : null}
        {view === 'pricing' ? <PricingScreen /> : null}
      </AppShell>
    </>
  );
};
