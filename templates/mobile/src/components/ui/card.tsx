import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

/** Shared props for the structural card pieces: children plus a style override. */
interface CardSectionProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Shared props for the textual card pieces: children plus a text style override. */
interface CardTextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * Bordered surface container — the RN parallel of the web `Card`. Reads the
 * `card`/`border` tokens from {@link useTheme} so it matches web. Compose it with
 * {@link CardHeader}, {@link CardTitle}, {@link CardDescription}, {@link CardContent},
 * and {@link CardFooter} for the same structure the web screens use.
 */
export function Card({ children, style }: CardSectionProps) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Header region of a {@link Card} — stacks title + description with padding. */
export function CardHeader({ children, style }: CardSectionProps) {
  return <View style={[styles.header, style]}>{children}</View>;
}

/** Prominent card title text. */
export function CardTitle({ children, style }: CardTextProps) {
  const { colors, fontSizes, fontWeights } = useTheme();
  return (
    <Text
      style={[
        { color: colors.cardForeground, fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Muted supporting line under a {@link CardTitle}. */
export function CardDescription({ children, style }: CardTextProps) {
  const { colors, fontSizes } = useTheme();
  return (
    <Text style={[{ color: colors.mutedForeground, fontSize: fontSizes.sm }, style]}>
      {children}
    </Text>
  );
}

/** Body region of a {@link Card} — padded, with the top padding removed to sit under the header. */
export function CardContent({ children, style }: CardSectionProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

/** Footer region of a {@link Card} — a padded row for actions. */
export function CardFooter({ children, style }: CardSectionProps) {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    padding: 24,
    gap: 6,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});
