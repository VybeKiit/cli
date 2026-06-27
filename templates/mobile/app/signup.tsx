import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/use-async';
import { signUpWithPassword } from '@/lib/auth-client';
import { useTheme } from '@/theme/use-theme';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

/**
 * Sign-up screen — the RN parallel of the web signup page, with the same copy,
 * loading, and inline error states. Account creation is a marked stub until the
 * `connect-account` skill wires `@vybekiit/auth`.
 */
export default function SignupScreen() {
  const router = useRouter();
  const { colors, fontSizes } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signUp } = useAsync(signUpWithPassword);

  async function handleSubmit() {
    const result = await signUp(email, password);
    if (!result.ok) return;
    // TODO(vybekiit): after sign-up, send the builder to verify their email — skill: connect-account
    router.replace('/verify');
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start building in a couple of minutes."
      footer={
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: colors.foreground, textDecorationLine: 'underline' }}>
            Sign in
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
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={pending ? 'Creating account...' : 'Create account'}
        loading={pending}
        onPress={handleSubmit}
      />
    </AuthShell>
  );
}
