import { useTheme } from '@/theme/useTheme';
import { type StyleProp, View, type ViewStyle } from 'react-native';

export interface SkeletonProps {
  readonly style?: StyleProp<ViewStyle>;
  readonly height?: number;
  readonly width?: number | `${number}%`;
}

/**
 * Placeholder block for loading states.
 *
 * @param props - Optional style and dimensions for the placeholder.
 * @returns A themed skeleton block.
 * @example
 * <Skeleton height={24} />
 */
export const Skeleton = ({ style, height = 16, width = '100%' }: SkeletonProps) => {
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
};
