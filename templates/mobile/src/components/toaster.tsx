import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/theme/useTheme';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Render active toasts from the module-level toast store.
 *
 * @returns The themed toast viewport.
 * @example
 * <Toaster />
 */
export const Toaster = () => {
  const { toasts } = useToast();
  const { colors, radius, spacing, fontSizes } = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[styles.container, { gap: spacing.sm, padding: spacing.md }]}
    >
      {toasts.map((toast) => {
        const isDestructive = toast.variant === 'destructive';
        return (
          <View
            key={toast.id}
            style={[
              styles.toast,
              {
                backgroundColor: isDestructive ? colors.destructive : colors.background,
                borderColor: isDestructive ? colors.destructive : colors.border,
                borderRadius: radius,
                padding: spacing.sm + spacing.xs,
              },
            ]}
          >
            <Text
              style={{
                color: isDestructive ? colors.destructiveForeground : colors.foreground,
                fontSize: fontSizes.sm,
              }}
            >
              {toast.message}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 360,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
