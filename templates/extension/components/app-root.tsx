import { AppShell } from '@/components/app-shell';
import { HomeScreen } from '@/components/screens/home-screen';
import { LoginScreen } from '@/components/screens/login-screen';
import { PricingScreen } from '@/components/screens/pricing-screen';
import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import type { ExtensionSurface, ExtensionView } from '@/lib/view';
import { useState } from 'react';

export function AppRoot({ surface }: { surface: ExtensionSurface }) {
  const [view, setView] = useState<ExtensionView>('home');

  return (
    <>
      <ReportModeDev />
      <AppShell surface={surface} view={view} onViewChange={setView}>
        {view === 'home' ? <HomeScreen onNavigate={setView} /> : null}
        {view === 'login' ? <LoginScreen onNavigate={setView} /> : null}
        {view === 'pricing' ? <PricingScreen /> : null}
      </AppShell>
    </>
  );
}
