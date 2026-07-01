import { Input, type InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/theme/useTheme';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Props for {@link FormField}. Extends the {@link Input} (native `TextInput`) props
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
 * Label + input + inline error — the single field primitive every form uses, so no
 * screen hand-rolls its own error markup. The RN parallel of the web `FormField`:
 * with no DOM `aria-*`, it wires accessibility via `accessibilityLabel` (the label
 * text) and announces the error through `accessibilityLiveRegion`, and paints the
 * input's destructive border via `invalid` when an error is present.
 */
export function FormField({ label, error = '', ...props }: FormFieldProps) {
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
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
});
