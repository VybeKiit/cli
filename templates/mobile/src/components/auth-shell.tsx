import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme/useTheme';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

/** Props for {@link AuthShell} — mirrors the web template's AuthShell. */
export interface AuthShellProps {
  /** Message key for the card heading. */
  titleKey: string;
  /** Message key for the supporting line under the title. */
  descriptionKey: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Centered card layout shared by sign-in, sign-up, and verify screens.
 *
 * @param props - Title/description keys, form body, and optional footer.
 * @returns A themed auth page shell.
 * @example
 * <AuthShell titleKey="auth.login.title" descriptionKey="auth.login.description" />
 */
export const AuthShell = ({
  titleKey,
  descriptionKey,
  children = null,
  footer = null,
}: AuthShellProps) => {
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
            <CardTitle>{t(titleKey)}</CardTitle>
            <CardDescription>{t(descriptionKey)}</CardDescription>
          </CardHeader>
          <CardContent style={{ gap: spacing.md }}>{children}</CardContent>
        </Card>
        {footer ? <View style={{ marginTop: spacing.md }}>{footer}</View> : null}
      </View>
    </ScrollView>
  );
};

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
