import { useTheme } from '@/theme/useTheme';
import { Text, View, type ViewStyle } from 'react-native';

/** Circular initials avatar — mirrors web Avatar + AvatarFallback. */
export function Avatar({
  label,
  size = 32,
  style,
}: {
  label: string;
  size?: number;
  style?: ViewStyle;
}) {
  const { colors, fontSizes, fontWeights } = useTheme();
  const initials = label.slice(0, 2).toUpperCase();
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.muted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{ color: colors.foreground, fontSize: fontSizes.xs, fontWeight: fontWeights.medium }}
      >
        {initials}
      </Text>
    </View>
  );
}
