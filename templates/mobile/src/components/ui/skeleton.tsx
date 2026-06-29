import { useTheme } from '@/theme/use-theme';
import { type StyleProp, View, type ViewStyle } from 'react-native';

/** Animated placeholder block for loading states — mirrors web Skeleton. */
export function Skeleton({
  style,
  height = 16,
  width = '100%',
}: {
  style?: StyleProp<ViewStyle>;
  height?: number;
  width?: number | `${number}%`;
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        {
          height,
          width,
          backgroundColor: colors.muted,
          borderRadius: radius,
          opacity: 0.6,
        },
        style,
      ]}
    />
  );
}
