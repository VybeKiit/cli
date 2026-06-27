import { Toaster } from '@/components/toaster';
import { useTheme } from '@/theme/use-theme';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Root layout for the expo-router app — the RN parallel of the web `app/layout.tsx`.
 *
 * Wraps every route in a `SafeAreaProvider` (so screens can inset around notches),
 * mounts the single `<Toaster />` once at the root (any screen fires toasts via
 * `useToast()`), and themes the navigation header + status bar from the shared
 * tokens. Dark mode follows the OS via {@link useTheme}; the `StatusBar` flips its
 * icon color to stay legible. RTL mirroring is handled by React Native's
 * `I18nManager` at the layout level, so screens use logical flex layout and don't
 * hardcode left/right.
 *
 * NOTE: the web template's `/terms` and `/privacy` pages are intentionally NOT
 * mirrored here — they are marketing/legal pages a store listing links to, not app
 * screens. App Store / Play privacy links live in the store listing (launch.config.ts),
 * not in the native navigation.
 */
export default function RootLayout() {
  const { colors, scheme } = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="login" options={{ title: 'Sign in' }} />
        <Stack.Screen name="signup" options={{ title: 'Create account' }} />
        <Stack.Screen name="verify" options={{ title: 'Verify email' }} />
        <Stack.Screen name="pricing" options={{ title: 'Pricing' }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      </Stack>
      <Toaster />
    </SafeAreaProvider>
  );
}
