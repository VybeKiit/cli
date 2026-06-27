import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/use-async';
import { signInWithPassword } from '@/lib/auth-client';
import { useTheme } from '@/theme/use-theme';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

/**
 * Sign-in screen — the RN parallel of the web login page, with the same copy,
 * loading, and inline error states. The actual sign-in is a marked stub until the
 * `connect-account` skill wires `@vybekiit/auth`.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { colors, fontSizes } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signIn } = useAsync(signInWithPassword);

  async function handleSubmit() {
    const result = await signIn(email, password);
    if (!result.ok) return;
    // TODO(vybekiit): send the signed-in builder to their dashboard — skill: connect-account
    router.replace('/dashboard');
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your account."
      footer={
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
          New here?{' '}
          <Link
            href="/signup"
            style={{ color: colors.foreground, textDecorationLine: 'underline' }}
          >
            Create an account
          </Link>
        </Text>
      }
    >
      {error ? (
        <Alert variant="destructive">
          <AlertDescription destructive>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label="Password"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={pending ? 'Signing in...' : 'Sign in'}
        loading={pending}
        onPress={handleSubmit}
      />
    </AuthShell>
  );
}
