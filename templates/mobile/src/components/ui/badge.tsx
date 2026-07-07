import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  readonly children?: ReactNode;
  readonly variant?: BadgeVariant;
  readonly style?: ViewStyle;
}

/**
 * Small themed status label.
 *
 * @param props - Badge content, visual variant, and optional style.
 * @returns A themed badge.
 * @example
 * <Badge variant="secondary">Beta</Badge>
 */
export const Badge = ({ children = null, variant = 'default', style }: BadgeProps) => {
  const { colors, radius, fontSizes, fontWeights, spacing } = useTheme();

  const palette = {
    default: { bg: colors.primary, fg: colors.primaryForeground, border: colors.primary },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground, border: colors.secondary },
    destructive: {
      bg: colors.destructive,
      fg: colors.destructiveForeground,
      border: colors.destructive,
    },
    outline: { bg: colors.background, fg: colors.foreground, border: colors.border },
  }[variant];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: radius,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs / 2,
        },
        style,
      ]}
    >
      <Text style={{ color: palette.fg, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold }}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
