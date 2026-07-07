import { useTheme } from '@/theme/useTheme';
import { Text, View, type ViewStyle } from 'react-native';

interface AvatarProps {
  readonly label?: string;
  readonly size?: number;
  readonly style?: ViewStyle;
}

/**
 * Circular initials avatar for account affordances.
 *
 * @param props - Label, size, and optional style for the avatar.
 * @returns A themed circular initials avatar.
 * @example
 * <Avatar label="you@local.dev" />
 */
export const Avatar = ({ label = '', size = 32, style }: AvatarProps) => {
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
};
