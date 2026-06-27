'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sendEmailCode, verifyEmailCode } from '@/lib/auth-client';
import { type FormEvent, useState } from 'react';

/**
 * Email verification (one-time code) screen — full layout with verify + resend
 * states. Sending and checking codes are marked stubs until the `add-signin`
 * skill wires Supabase email OTP.
 */
export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setPending(true);
    const result = await verifyEmailCode(email, code);
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    // TODO(vybekiit): send the verified builder to their dashboard — skill: add-signin
    window.location.href = '/dashboard';
  }

  async function handleResend() {
    setError('');
    setMessage('');
    const result = await sendEmailCode(email);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setMessage('We sent you a new code.');
  }

  return (
    <AuthShell title="Check your email" description="Enter the code we sent to confirm it is you.">
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <FormField
          id="code"
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Checking...' : 'Verify'}
        </Button>
        <Button type="button" variant="ghost" onClick={handleResend}>
          Resend code
        </Button>
      </form>
    </AuthShell>
  );
}
