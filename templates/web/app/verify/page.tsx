'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/use-async';
import { useToast } from '@/hooks/use-toast';
import { sendEmailCode, verifyEmailCode } from '@/lib/auth-client';
import type { AuthUser } from '@vybekiit/auth';
import type { Result } from '@vybekiit/core';
import { type FormEvent, useState } from 'react';

/** A verify-or-resend request, discriminated by `kind` for one async pipeline. */
type AuthAction =
  | { kind: 'verify'; email: string; code: string }
  | { kind: 'resend'; email: string };

/**
 * Run the requested auth-client call. Both flows feed one {@link useAsync} so
 * the screen has a single loading/error source; callers branch only on `ok`,
 * so the differing success values (`AuthUser` vs `true`) are unified here.
 */
function runAuthAction(action: AuthAction): Promise<Result<AuthUser | true>> {
  if (action.kind === 'verify') return verifyEmailCode(action.email, action.code);
  return sendEmailCode(action.email);
}

/**
 * Email verification (one-time code) screen — full layout with verify + resend
 * states. Sending and checking codes are marked stubs until the `add-signin`
 * skill wires Supabase email OTP.
 */
export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  // Verify and resend share one async-state source so a stale error from either
  // flow clears the moment the other runs (matching the original single `error`).
  const { loading: pending, error, run: submit } = useAsync(runAuthAction);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const result = await submit({ kind: 'verify', email, code });
    if (!result.ok) return;
    // TODO(vybekiit): send the verified builder to their dashboard — skill: add-signin
    window.location.href = '/dashboard';
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
