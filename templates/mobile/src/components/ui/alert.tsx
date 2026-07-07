import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, Text, type TextStyle, View } from 'react-native';

/** Visual intent of an {@link Alert}, mirroring the web alert variants. */
export type AlertVariant = 'default' | 'destructive';

/** Props for {@link Alert}: the variant plus the title/description body. */
export interface AlertProps {
  /** Visual variant. Defaults to `default`. */
  variant?: AlertVariant;
  /** Body content, typically an {@link AlertTitle} and/or {@link AlertDescription}. */
  children?: ReactNode;
}

/**
 * Inline message box for status and error messages.
 *
 * @param props - Alert variant and body content.
 * @returns A themed alert container.
 * @example
 * <Alert variant="destructive"><AlertTitle>Check this</AlertTitle></Alert>
 */
export const Alert = ({ variant = 'default', children = null }: AlertProps) => {
  const { colors, radius, spacing } = useTheme();
  const isDestructive = variant === 'destructive';
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.alert,
        {
          backgroundColor: colors.background,
          borderColor: isDestructive ? colors.destructive : colors.border,
          borderRadius: radius,
          paddingVertical: spacing.sm + spacing.xs,
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      {children}
    </View>
  );
};

interface AlertTitleProps {
  readonly children?: ReactNode;
  readonly style?: StyleProp<TextStyle>;
}

/**
 * Bold heading line inside an alert.
 *
 * @param props - Alert title content and optional text style.
 * @returns The themed alert title text.
 * @example
 * <AlertTitle>Check this</AlertTitle>
 */
export const AlertTitle = ({ children = null, style }: AlertTitleProps) => {
  const { colors, fontSizes, fontWeights } = useTheme();
  return (
    <Text
      style={[
        { color: colors.foreground, fontSize: fontSizes.sm, fontWeight: fontWeights.medium },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

interface AlertDescriptionProps {
  readonly children?: ReactNode;
  readonly destructive?: boolean;
  readonly style?: StyleProp<TextStyle>;
}

/**
 * Body text inside an alert.
 *
 * @param props - Alert description content, intent, and optional text style.
 * @returns The themed alert body text.
 * @example
 * <AlertDescription destructive={true}>Try again.</AlertDescription>
 */
export const AlertDescription = ({
  children = null,
  destructive = false,
  style,
}: AlertDescriptionProps) => {
  const { colors, fontSizes } = useTheme();
  return (
    <Text
      style={[
        { color: destructive ? colors.destructive : colors.foreground, fontSize: fontSizes.sm },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  alert: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
