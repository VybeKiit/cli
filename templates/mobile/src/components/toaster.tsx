import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/theme/useTheme';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Renders the active toasts from the module-level store. Mount this once in the
 * root layout (see `app/_layout.tsx`); anywhere else can fire one via `useToast()`.
 *
 * The RN parallel of the web `<Toaster />`. Accessible by default: the container
 * uses `accessibilityLiveRegion="polite"` (the RN equivalent of web's
 * `aria-live="polite"`) so screen readers announce new toasts without stealing
 * focus. Styling reuses the shared theme tokens (background/border/foreground, with
 * the `destructive` palette for errors) so toasts match the rest of the kit. It is
 * `pointerEvents="none"` so it never blocks taps on the screen beneath it.
 */
export function Toaster() {
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
}

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
