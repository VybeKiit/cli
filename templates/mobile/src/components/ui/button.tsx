import { useTheme } from '@/theme/useTheme';
import { useCallback } from 'react';
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
 * Props for {@link Button}. Extends the native `Pressable` props so callers pass
 * `onPress`, `accessibilityLabel`, etc.) with the kit's variant/size system and a
 * `loading` flag that disables the press and swaps the label for a spinner.
 */
export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  /** Button label text. */
  title: string;
  /** Optional compact icon text rendered before the label. */
  icon?: string;
  /** Visual variant. Defaults to `default`. */
  variant?: ButtonVariant;
  /** Size preset. Defaults to `default`. */
  size?: ButtonSize;
  /** Show a spinner and block presses while an action is in flight. */
  loading?: boolean;
}

const resolveButtonOpacity = (isDisabled: boolean, pressed: boolean): number => {
  if (isDisabled) {
    return 0.5;
  }
  if (pressed) {
    return 0.9;
  }
  return 1;
};

/**
 * The shared pressable button every screen uses.
 *
 * @param props - Native pressable props plus title, variant, size, and loading state.
 * @returns A themed button.
 * @example
 * <Button title="Continue" onPress={handleContinue} />
 */
export const Button = ({
  title = '',
  icon,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  ...props
}: ButtonProps) => {
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
  const pressableStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.base,
      sizeStyle,
      {
        backgroundColor,
        borderColor,
        borderWidth: variant === 'outline' ? StyleSheet.hairlineWidth : 0,
        borderRadius: radius,
        opacity: resolveButtonOpacity(isDisabled, pressed),
      },
    ],
    [backgroundColor, borderColor, isDisabled, radius, sizeStyle, variant],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={pressableStyle}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon === undefined ? null : (
            <Text
              style={{
                color: textColor,
                fontSize: fontSizes.sm,
                fontWeight: fontWeights.semibold,
              }}
            >
              {icon}
            </Text>
          )}
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
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
