import { t } from '@/lib/i18n';
import { useTheme } from '@/theme/useTheme';
import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';

const TAB_ICONS = {
  dashboard: '⌂',
  orders: '☰',
  products: '▦',
  settings: '⚙',
} as const;

/**
 * Bottom tab navigator for the signed-in product shell.
 *
 * @returns Expo Router tab layout for Home, Orders, Products, and Settings.
 * @example
 * // File-based: app/(tabs)/_layout.tsx
 */
const TabsLayout = () => {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('navigation.tab.home'),
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size * 0.85 }}>{TAB_ICONS.dashboard}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('navigation.tab.orders'),
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size * 0.85 }}>{TAB_ICONS.orders}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t('navigation.tab.products'),
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size * 0.85 }}>{TAB_ICONS.products}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('navigation.tab.settings'),
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size * 0.85 }}>{TAB_ICONS.settings}</Text>
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
