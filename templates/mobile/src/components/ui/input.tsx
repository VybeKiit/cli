import { useTheme } from '@/theme/useTheme';
import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

/**
 * Props for {@link Input}. Extends the native `TextInput` props, plus an `invalid`
 * flag the {@link FormField} sets to paint the destructive border on a validation
 * error (the RN parallel to web's `aria-invalid` styling).
 */
export interface InputProps extends TextInputProps {
  /** When true, draw the destructive border + focus ring. */
  invalid?: boolean;
}

const resolveBorderColor = (
  invalid: boolean,
  focused: boolean,
  colors: ReturnType<typeof useTheme>['colors'],
): string => {
  if (invalid) {
    return colors.destructive;
  }
  if (focused) {
    return colors.ring;
  }
  return colors.input;
};

/**
 * The shared single-line text field.
 *
 * @param props - Native text input props plus the validation state.
 * @returns A themed text input.
 * @example
 * <Input value={email} onChangeText={setEmail} />
 */
export const Input = ({ invalid = false, style, onFocus, onBlur, ...props }: InputProps) => {
  const { colors, radius, spacing, fontSizes } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = resolveBorderColor(invalid, focused, colors);
  const handleFocus = useCallback<NonNullable<TextInputProps['onFocus']>>(
    (event) => {
      setFocused(true);
      onFocus?.(event);
    },
    [onFocus],
  );
  const handleBlur = useCallback<NonNullable<TextInputProps['onBlur']>>(
    (event) => {
      setFocused(false);
      onBlur?.(event);
    },
    [onBlur],
  );

  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[
        styles.base,
        {
          color: colors.foreground,
          backgroundColor: colors.background,
          borderColor,
          borderRadius: radius,
          paddingHorizontal: spacing.sm + spacing.xs,
          fontSize: fontSizes.base,
        },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    height: 40,
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
