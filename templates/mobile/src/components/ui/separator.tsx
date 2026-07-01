import { useTheme } from '@/theme/useTheme';
import { StyleSheet, View, type ViewStyle } from 'react-native';

/** Horizontal rule — mirrors web Separator. */
export function Separator({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />
  );
}
