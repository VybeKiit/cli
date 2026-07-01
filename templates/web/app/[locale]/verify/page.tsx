'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useRouter } from '@/i18n/navigation';
import { sendEmailCode, verifyEmailCode } from '@/lib/authClient';
import type { AuthUser } from '@vybekiit/auth';
import type { Result } from '@vybekiit/core';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

/** A verify-or-resend request, discriminated by `kind` for one async pipeline. */
type AuthAction =
  | { kind: 'verify'; email: string; code: string }
  | { kind: 'resend'; email: string };

function runAuthAction(action: AuthAction): Promise<Result<AuthUser | true>> {
  if (action.kind === 'verify') return verifyEmailCode(action.email, action.code);
  return sendEmailCode(action.email);
}

/** Show a catalog key or pass through a server error message. */
function displayError(t: ReturnType<typeof useTranslations>, error: string): string {
  try {
    return t(error as 'auth.errors.enterEmailAndPassword');
  } catch {
    return error;
  }
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
  const router = useRouter();
  const t = useTranslations();
  const { loading: pending, error, run: submit } = useAsync(runAuthAction);

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const result = await submit({ kind: 'verify', email, code });
    if (!result.ok) return;
    router.push('/dashboard');
  }

  async function handleResend() {
    setMessage('');
    const result = await submit({ kind: 'resend', email });
    if (!result.ok) return;
    const sent = t('auth.verify.codeSent');
    setMessage(sent);
    toast(sent);
  }

  return (
    <AuthShell titleKey="auth.verify.title" descriptionKey="auth.verify.description">
      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{displayError(t, error)}</AlertDescription>
          </Alert>
        ) : null}
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <FormField
          id="email"
          label={t('auth.verify.emailLabel')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required={true}
        />
        <FormField
          id="code"
          label={t('auth.verify.codeLabel')}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          required={true}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t('auth.verify.submitting') : t('auth.verify.submit')}
        </Button>
        <Button type="button" variant="ghost" onClick={handleResend}>
          {t('auth.verify.resend')}
        </Button>
      </form>
    </AuthShell>
  );
}
