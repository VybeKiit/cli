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
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Shared props for the textual card pieces: children plus a text style override. */
interface CardTextProps {
  children?: ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * Bordered surface container for repeated content sections.
 *
 * @param props - Card body and optional view style.
 * @returns A themed bordered card container.
 * @example
 * <Card><CardContent>Body</CardContent></Card>
 */
export const Card = ({ children = null, style }: CardSectionProps) => {
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
};

/**
 * Header region of a card.
 *
 * @param props - Header content and optional view style.
 * @returns A padded card header.
 * @example
 * <CardHeader><CardTitle>Dashboard</CardTitle></CardHeader>
 */
export const CardHeader = ({ children = null, style }: CardSectionProps) => (
  <View style={[styles.header, style]}>{children}</View>
);

/**
 * Prominent card title text.
 *
 * @param props - Title content and optional text style.
 * @returns The themed title text.
 * @example
 * <CardTitle>Dashboard</CardTitle>
 */
export const CardTitle = ({ children = null, style }: CardTextProps) => {
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
};

/**
 * Muted supporting line under a card title.
 *
 * @param props - Description content and optional text style.
 * @returns The themed description text.
 * @example
 * <CardDescription>Track your latest work.</CardDescription>
 */
export const CardDescription = ({ children = null, style }: CardTextProps) => {
  const { colors, fontSizes } = useTheme();
  return (
    <Text style={[{ color: colors.mutedForeground, fontSize: fontSizes.sm }, style]}>
      {children}
    </Text>
  );
};

/**
 * Body region of a card.
 *
 * @param props - Content and optional view style.
 * @returns The padded card content area.
 * @example
 * <CardContent>Body</CardContent>
 */
export const CardContent = ({ children = null, style }: CardSectionProps) => (
  <View style={[styles.content, style]}>{children}</View>
);

/**
 * Footer region of a card.
 *
 * @param props - Footer content and optional view style.
 * @returns The card footer action row.
 * @example
 * <CardFooter><Button title="Save" /></CardFooter>
 */
export const CardFooter = ({ children = null, style }: CardSectionProps) => (
  <View style={[styles.footer, style]}>{children}</View>
);

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
