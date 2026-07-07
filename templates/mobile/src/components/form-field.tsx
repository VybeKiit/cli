import { Input, type InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/theme/useTheme';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Props for {@link FormField}. Extends the {@link Input} native `TextInput` props
 * so callers pass `value`, `onChangeText`, `keyboardType`, `autoComplete`, etc.
 * straight through.
 */
export interface FormFieldProps extends Omit<InputProps, 'invalid' | 'accessibilityLabel'> {
  /** Visible label text, also used as the input's `accessibilityLabel`. */
  label: string;
  /** Inline validation message. Empty string renders nothing (no `undefined` needed under EOPT). */
  error?: string;
}

/**
 * Label, input, and inline error field primitive.
 *
 * @param props - Input props plus label and optional error message.
 * @returns A themed form field.
 * @example
 * <FormField label="Email" value={email} onChangeText={setEmail} />
 */
export const FormField = ({ label, error = '', ...props }: FormFieldProps) => {
  const { colors, spacing, fontSizes } = useTheme();
  const hasError = error.length > 0;
  return (
    <View style={styles.field}>
      <Label>{label}</Label>
      <Input accessibilityLabel={label} invalid={hasError} {...props} />
      {hasError ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.destructive, fontSize: fontSizes.sm, marginTop: spacing.xs / 2 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
});
