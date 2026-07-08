import { useTheme } from '@/theme/useTheme';
import { type StyleProp, Text, type TextStyle } from 'react-native';

/** Props for {@link Label}: the visible text plus optional style overrides. */
export interface LabelProps {
  /** Label text. */
  children: string;
  /** Optional style overrides merged after the theme defaults. */
  style?: StyleProp<TextStyle>;
}

/**
 * Form field label.
 *
 * @param props - Label text and optional text style.
 * @returns A themed label text node.
 * @example
 * <Label>Email</Label>
 *
 * A themed `Text` matching the web label's size/weight. Pair it
 * with {@link Input} inside {@link FormField}; RN has no `htmlFor`, so the label is
 * purely visual and the input carries its own `accessibilityLabel`.
 */
export const Label = ({ children = '', style }: LabelProps) => {
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
};
