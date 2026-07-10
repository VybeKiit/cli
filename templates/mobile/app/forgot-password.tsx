import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { useTheme } from '@/theme/useTheme';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

/**
 * Practice forgot-password screen. Real reset email wiring is the reset-password skill.
 *
 * @returns React Native forgot-password form.
 * @example
 * <ForgotPasswordScreen />
 */
const ForgotPasswordScreen = () => {
  const { colors, fontSizes } = useTheme();
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (email.trim().length === 0) {
      setError(t('auth.errors.enterEmail'));
      return;
    }
    setError('');
    setSent(true);
  };

  return (
    <AuthShell
      titleKey="auth.forgot.title"
      descriptionKey="auth.forgot.description"
      footer={
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
          {t('auth.forgot.footerPrefix')}{' '}
          <Link href="/login" style={{ color: colors.foreground, textDecorationLine: 'underline' }}>
            {t('auth.forgot.footerLink')}
          </Link>
        </Text>
      }
    >
      {error.length > 0 ? (
        <Alert variant="destructive">
          <AlertDescription destructive={true}>{error}</AlertDescription>
        </Alert>
      ) : null}
      {sent ? (
        <Alert>
          <AlertDescription>{t('auth.forgot.sent')}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label={t('auth.forgot.emailLabel')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <Button
        title={sent ? t('auth.forgot.resend') : t('auth.forgot.submit')}
        onPress={handleSubmit}
      />
    </AuthShell>
  );
};

export default ForgotPasswordScreen;
