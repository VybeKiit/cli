import { useTheme } from '@/theme/useTheme';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

/** Visual style of the button — mirrors the web template's button variants. */
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

/** Height/padding preset — mirrors the web template's button sizes. */
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

/**
 * Props for {@link Button}. Extends the native `Pressable` props (so callers pass
 * `onPress`, `accessibilityLabel`, etc.) with the kit's variant/size system and a
 * `loading` flag that disables the press and swaps the label for a spinner.
 */
export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Button label text. */
  title: string;
  /** Visual variant. Defaults to `default`. */
  variant?: ButtonVariant;
  /** Size preset. Defaults to `default`. */
  size?: ButtonSize;
  /** Show a spinner and block presses while an action is in flight. */
  loading?: boolean;
}

/**
 * The shared pressable button every screen uses.
 *
 * A plain RN `Pressable` styled from {@link useTheme} so it reads the same shared
 * `@vybekiit/tokens` palette as the web button — keeping the two platforms visually
 * in sync (ADR-0004). `loading` and `disabled` both block the press and dim the
 * control; `loading` also replaces the label with an `ActivityIndicator`. The
 * `link` variant renders text-only (no background) to match web.
 */
export function Button({
  title,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const { colors, radius, spacing, fontSizes, fontWeights } = useTheme();
  const isDisabled = disabled === true || loading;

  const sizeStyle: ViewStyle = {
    default: { height: 40, paddingHorizontal: spacing.md },
    sm: { height: 32, paddingHorizontal: spacing.sm + spacing.xs },
    lg: { height: 44, paddingHorizontal: spacing.xl },
    icon: { height: 40, width: 40, paddingHorizontal: 0 },
  }[size];

  const backgroundColor: string = {
    default: colors.primary,
    destructive: colors.destructive,
    outline: colors.background,
    secondary: colors.secondary,
    ghost: 'transparent',
    link: 'transparent',
  }[variant];

  const textColor: string = {
    default: colors.primaryForeground,
    destructive: colors.destructiveForeground,
    outline: colors.foreground,
    secondary: colors.secondaryForeground,
    ghost: colors.foreground,
    link: colors.primary,
  }[variant];

  const borderColor = variant === 'outline' ? colors.input : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        {
          backgroundColor,
          borderColor,
          borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth : 0,
          borderRadius: radius,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={{
            color: textColor,
            fontSize: fontSizes.sm,
            fontWeight: fontWeights.medium,
            textDecorationLine: variant === 'link' ? 'underline' : 'none',
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
