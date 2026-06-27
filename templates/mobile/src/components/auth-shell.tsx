import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/theme/use-theme';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

/** Props for {@link AuthShell} — mirrors the web template's AuthShell. */
export interface AuthShellProps {
  /** Card heading, e.g. "Welcome back". */
  title: string;
  /** Supporting line under the title. */
  description: string;
  /** The form (or other body content) rendered inside the card. */
  children: ReactNode;
  /** Optional content under the card, e.g. a link to the opposite auth action. */
  footer?: ReactNode;
}

/**
 * Centered card layout shared by the sign-in, sign-up, and verify screens — the RN
 * parallel of the web `AuthShell`. Wraps the card in a `ScrollView` so the keyboard
 * never covers the inputs, and centers it against the theme background.
 */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const { colors, spacing } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent style={{ gap: spacing.md }}>{children}</CardContent>
        </Card>
        {footer ? <View style={{ marginTop: spacing.md }}>{footer}</View> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
});
