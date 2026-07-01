import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { displayError, useTranslations } from '@/hooks/useTranslations';
import { signInWithPassword } from '@/lib/authClient';
import { useTheme } from '@/theme/useTheme';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

/** Sign-in screen — RN parallel of the web login page. */
export default function LoginScreen() {
  const router = useRouter();
  const { colors, fontSizes } = useTheme();
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signIn } = useAsync(signInWithPassword);

  async function handleSubmit() {
    const result = await signIn(email, password);
    if (!result.ok) return;
    router.replace('/dashboard');
  }

  return (
    <AuthShell
      titleKey="auth.login.title"
      descriptionKey="auth.login.description"
      footer={
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
          {t('auth.login.footerPrefix')}{' '}
          <Link
            href="/signup"
            style={{ color: colors.foreground, textDecorationLine: 'underline' }}
          >
            {t('auth.login.footerLink')}
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
        label={t('auth.login.emailLabel')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label={t('auth.login.passwordLabel')}
        secureTextEntry={true}
        autoComplete="current-password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={pending ? t('auth.login.submitting') : t('auth.login.submit')}
        loading={pending}
        onPress={handleSubmit}
      />
    </AuthShell>
  );
}
