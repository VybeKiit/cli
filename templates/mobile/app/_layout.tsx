import { ClientStateProvider } from '@/lib/client-state';
import { Toaster } from '@/components/toaster';
import { ReportModeDev } from '@/components/report-mode/report-mode-dev';
import { initI18n, t } from '@/lib/i18n';
import { useTheme } from '@/theme/useTheme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/** Stack screen titles — keys into `messages/en.json`. */
const SCREEN_TITLES = {
  index: 'navigation.screen.home',
  login: 'navigation.screen.login',
  signup: 'navigation.screen.signup',
  verify: 'navigation.screen.verify',
  pricing: 'navigation.screen.pricing',
  dashboard: 'navigation.screen.dashboard',
} as const;

/**
 * Root layout — initializes i18n from the device locale, applies RTL when needed,
 * and sets translated stack titles.
 */
export default function RootLayout() {
  const { colors, scheme } = useTheme();
  const [, setLocaleReady] = useState(false);

  useEffect(() => {
    initI18n();
    setLocaleReady(true);
  }, []);

  return (
    <SafeAreaProvider>
      <ClientStateProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.foreground,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: t(SCREEN_TITLES.index) }} />
          <Stack.Screen name="login" options={{ title: t(SCREEN_TITLES.login) }} />
          <Stack.Screen name="signup" options={{ title: t(SCREEN_TITLES.signup) }} />
          <Stack.Screen name="verify" options={{ title: t(SCREEN_TITLES.verify) }} />
          <Stack.Screen name="pricing" options={{ title: t(SCREEN_TITLES.pricing) }} />
          <Stack.Screen name="dashboard" options={{ title: t(SCREEN_TITLES.dashboard) }} />
        </Stack>
        <Toaster />
        <ReportModeDev />
      </ClientStateProvider>
    </SafeAreaProvider>
  );
}
