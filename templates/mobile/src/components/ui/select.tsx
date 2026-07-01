import { useTheme } from '@/theme/useTheme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Simple option picker — mirrors web Select for plan/account pickers. */
export function Select<T extends string>({
  value,
  options,
  onValueChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onValueChange: (value: T) => void;
  label?: string;
}) {
  const { colors, radius, spacing, fontSizes, fontWeights } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {label ? (
        <Text
          style={{
            color: colors.foreground,
            fontSize: fontSizes.sm,
            fontWeight: fontWeights.medium,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View style={{ gap: spacing.xs }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: value === option.value }}
            onPress={() => onValueChange(option.value)}
            style={[
              styles.option,
              {
                borderColor: colors.border,
                borderRadius: radius,
                backgroundColor: value === option.value ? colors.secondary : colors.background,
                padding: spacing.sm,
              },
            ]}
          >
            <Text style={{ color: colors.foreground, fontSize: fontSizes.sm }}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
