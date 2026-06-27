import { useTheme } from '@/theme/use-theme';
import { useState } from 'react';
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

/**
 * The shared single-line text field.
 *
 * A plain RN `TextInput` styled from {@link useTheme} so it matches the web input
 * (same border/radius/placeholder colors from `@vybekiit/tokens`). It tracks focus
 * locally to swap the border to the theme `ring` color, mirroring web's
 * `focus-visible:ring`. Placeholder color comes from `mutedForeground`.
 */
export function Input({ invalid = false, style, onFocus, onBlur, ...props }: InputProps) {
  const { colors, radius, spacing, fontSizes } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = invalid ? colors.destructive : focused ? colors.ring : colors.input;

  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
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
}

const styles = StyleSheet.create({
  base: {
    height: 40,
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
