import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, Text, type TextStyle, View } from 'react-native';

/** Visual intent of an {@link Alert} — mirrors the web alert variants. */
export type AlertVariant = 'default' | 'destructive';

/** Props for {@link Alert}: the variant plus the title/description body. */
export interface AlertProps {
  /** Visual variant. Defaults to `default`. */
  variant?: AlertVariant;
  /** Body content — typically an {@link AlertTitle} and/or {@link AlertDescription}. */
  children: ReactNode;
}

/**
 * Inline message box — the RN parallel of the web `Alert`. The `destructive`
 * variant tints the border and text with the theme `destructive` color (errors),
 * while `default` uses the neutral background/foreground. Marked `accessibilityRole="alert"`
 * so screen readers announce it, matching web's `role="alert"`.
 */
export function Alert({ variant = 'default', children }: AlertProps) {
  const { colors, radius, spacing } = useTheme();
  const isDestructive = variant === 'destructive';
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.alert,
        {
          backgroundColor: colors.background,
          borderColor: isDestructive ? colors.destructive : colors.border,
          borderRadius: radius,
          paddingVertical: spacing.sm + spacing.xs,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      {children}
    </View>
  );
}

/** Bold heading line inside an {@link Alert}. */
export function AlertTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const { colors, fontSizes, fontWeights } = useTheme();
  return (
    <Text
      style={[
        { color: colors.foreground, fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/**
 * Body text inside an {@link Alert}. Defaults to the destructive color when no
 * explicit color is given via `style`, so a bare error description reads red like web.
 */
export function AlertDescription({
  children,
  destructive = false,
  style,
}: {
  children: ReactNode;
  destructive?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const { colors, fontSizes } = useTheme();
  return (
    <Text
      style={[
        { color: destructive ? colors.destructive : colors.foreground, fontSize: fontSizes.sm },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  alert: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
