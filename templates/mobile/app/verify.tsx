import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/hooks/use-toast';
import { sendEmailCode, verifyEmailCode } from '@/lib/auth-client';
import type { AuthUser } from '@vybekiit/auth';
import type { Result } from '@vybekiit/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';

/** A verify-or-resend request, discriminated by `kind` for one async pipeline. */
type AuthAction =
  | { kind: 'verify'; email: string; code: string }
  | { kind: 'resend'; email: string };

/**
 * Run the requested auth-client call. Both flows feed one {@link useAsync} so the
 * screen has a single loading/error source; callers branch only on `ok`, so the
 * differing success values (`AuthUser` vs `true`) are unified here.
 */
function runAuthAction(action: AuthAction): Promise<Result<AuthUser | true>> {
  if (action.kind === 'verify') return verifyEmailCode(action.email, action.code);
  return sendEmailCode(action.email);
}

/**
 * Email verification (one-time code) screen — the RN parallel of the web verify
 * page, with the same verify + resend states and copy. Sending and checking codes
 * are marked stubs until the `add-signin` skill wires email OTP.
 */
export default function VerifyScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  // Verify and resend share one async-state source so a stale error from either
  // flow clears the moment the other runs (matching the web's single `error`).
  const { loading: pending, error, run: submit } = useAsync(runAuthAction);

  async function handleVerify() {
    setMessage('');
    const result = await submit({ kind: 'verify', email, code });
    if (!result.ok) return;
    // TODO(vybekiit): send the verified builder to their dashboard — skill: add-signin
    router.replace('/dashboard');
  }

  async function handleResend() {
    setMessage('');
    const result = await submit({ kind: 'resend', email });
    if (!result.ok) return;
    setMessage('We sent you a new code.');
    toast('We sent you a new code.');
  }

  return (
    <AuthShell title="Check your email" description="Enter the code we sent to confirm it is you.">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription destructive>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
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
        label="Code"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        value={code}
        onChangeText={setCode}
      />
      <Button title={pending ? 'Checking...' : 'Verify'} loading={pending} onPress={handleVerify} />
      <Button title="Resend code" variant="ghost" onPress={handleResend} />
    </AuthShell>
  );
}
