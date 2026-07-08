import { useTheme } from '@/theme/useTheme';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface SeparatorProps {
  readonly style?: ViewStyle;
}

/**
 * Horizontal rule for separating grouped content.
 *
 * @param props - Optional view style merged after theme defaults.
 * @returns A themed separator line.
 * @example
 * <Separator />
 */
export const Separator = ({ style }: SeparatorProps) => {
  const { colors } = useTheme();
  return (
    <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />
  );
};
