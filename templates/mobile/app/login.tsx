import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { displayError, useTranslations } from '@/hooks/useTranslations';
import { useToast } from '@/hooks/useToast';
import { signInWithPassword } from '@/lib/authClient';
import { useTheme } from '@/theme/useTheme';
import { Either } from 'effect';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

/**
 * Render the mobile sign-in screen with email/password, forgot password, and OAuth rows.
 *
 * @returns React Native sign-in screen.
 * @example
 * <LoginScreen />
 */
const LoginScreen = () => {
  const router = useRouter();
  const { colors, fontSizes, spacing } = useTheme();
  const { t } = useTranslations();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signIn } = useAsync(signInWithPassword);

  const handleSubmit = async () => {
    const result = await signIn(email, password);
    if (Either.isLeft(result)) {
      return;
    }

    router.replace('/dashboard');
  };

  const handleGoogle = () => {
    toast(t('auth.oauth.googlePractice'));
  };

  const handleApple = () => {
    toast(t('auth.oauth.applePractice'));
  };

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
      <Link
        href="/forgot-password"
        style={{
          alignSelf: 'flex-end',
          color: colors.primary,
          fontSize: fontSizes.sm,
          marginTop: -spacing.xs,
        }}
      >
        {t('auth.login.forgotPassword')}
      </Link>
      <Button
        title={pending ? t('auth.login.submitting') : t('auth.login.submit')}
        loading={pending}
        onPress={handleSubmit}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.xs }}>
          {t('auth.login.orContinueWith')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <Button title={t('auth.oauth.google')} variant="outline" onPress={handleGoogle} />
      <Button title={t('auth.oauth.apple')} variant="outline" onPress={handleApple} />
    </AuthShell>
  );
};

export default LoginScreen;
