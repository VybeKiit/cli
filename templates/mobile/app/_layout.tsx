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
  forgotPassword: 'navigation.screen.forgotPassword',
  verify: 'navigation.screen.verify',
  pricing: 'navigation.screen.pricing',
  onboarding: 'navigation.screen.onboarding',
  serviceStatus: 'navigation.screen.status',
  changelog: 'navigation.screen.changelog',
  dynamic: 'navigation.screen.app',
} as const;

/**
 * Render the Expo Router root layout.
 *
 * @returns Root provider and stack layout for the mobile app.
 * @example
 * <RootLayout />
 */
const RootLayout = () => {
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
          <Stack.Screen
            name="forgot-password"
            options={{ title: t(SCREEN_TITLES.forgotPassword) }}
          />
          <Stack.Screen name="verify" options={{ title: t(SCREEN_TITLES.verify) }} />
          <Stack.Screen name="pricing" options={{ title: t(SCREEN_TITLES.pricing) }} />
          <Stack.Screen name="onboarding" options={{ title: t(SCREEN_TITLES.onboarding) }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="service-status" options={{ title: t(SCREEN_TITLES.serviceStatus) }} />
          <Stack.Screen name="changelog" options={{ title: t(SCREEN_TITLES.changelog) }} />
          <Stack.Screen name="[screen]" options={{ title: t(SCREEN_TITLES.dynamic) }} />
        </Stack>
        <Toaster />
        <ReportModeDev />
      </ClientStateProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
