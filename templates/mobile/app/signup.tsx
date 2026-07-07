import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { displayError, useTranslations } from '@/hooks/useTranslations';
import { signUpWithPassword } from '@/lib/authClient';
import { useTheme } from '@/theme/useTheme';
import { Either } from 'effect';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

/**
 * Render the mobile sign-up screen.
 *
 * @returns React Native sign-up screen.
 * @example
 * <SignupScreen />
 */
const SignupScreen = () => {
  const router = useRouter();
  const { colors, fontSizes } = useTheme();
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signUp } = useAsync(signUpWithPassword);

  const handleSubmit = async () => {
    const result = await signUp(email, password);
    if (Either.isLeft(result)) {
      return;
    }

    router.replace('/verify');
  };

  return (
    <AuthShell
      titleKey="auth.signup.title"
      descriptionKey="auth.signup.description"
      footer={
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
          {t('auth.signup.footerPrefix')}{' '}
          <Link href="/login" style={{ color: colors.foreground, textDecorationLine: 'underline' }}>
            {t('auth.signup.footerLink')}
          </Link>
        </Text>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription destructive={true}>{displayError(t, error)}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label={t('auth.signup.emailLabel')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label={t('auth.signup.passwordLabel')}
        secureTextEntry={true}
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={pending ? t('auth.signup.submitting') : t('auth.signup.submit')}
        loading={pending}
        onPress={handleSubmit}
      />
    </AuthShell>
  );
};

export default SignupScreen;
