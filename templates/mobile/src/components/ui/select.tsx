import { useTheme } from '@/theme/useTheme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface SelectProps<T extends string> {
  readonly value: T;
  readonly options: readonly SelectOption<T>[];
  readonly onValueChange: (value: T) => void;
  readonly label?: string;
}

/**
 * Simple option picker for plan and account settings.
 *
 * @param props - Current value, available options, change callback, and optional label.
 * @returns A themed option picker.
 * @example
 * <Select value={plan} options={options} onValueChange={setPlan} />
 */
export const Select = <T extends string>({
  value,
  options,
  onValueChange,
  label = '',
}: SelectProps<T>) => {
  const { colors, radius, spacing, fontSizes, fontWeights } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      {label.length > 0 ? (
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
};

const styles = StyleSheet.create({
  option: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
