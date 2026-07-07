'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Button } from '@vybekiit/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useRouter } from '@/i18n/navigation';
import { sendEmailCode, verifyEmailCode } from '@/lib/authClient';
import type { WebClientError } from '@/lib/clientEffect';
import type { AuthUser } from '@vybekiit/auth';
import { type Effect, Either } from 'effect';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, type FormEvent, useCallback, useId, useState } from 'react';

/** A verify-or-resend request, discriminated by `kind` for one async pipeline. */
type AuthAction =
  | { kind: 'verify'; email: string; code: string }
  | { kind: 'resend'; email: string };

const runAuthAction = (action: AuthAction): Effect.Effect<AuthUser | true, WebClientError> => {
  if (action.kind === 'verify') {
    return verifyEmailCode(action.email, action.code);
  }
  return sendEmailCode(action.email);
};

/** Show a catalog key or pass through a server error message. */
const displayError = (t: ReturnType<typeof useTranslations>, error: string): string => {
  try {
    return t(error as 'auth.errors.enterEmailAndPassword');
  } catch {
    return error;
  }
};

/**
 * Email verification (one-time code) screen — full layout with verify + resend
 * states. Sending and checking codes are marked stubs until the `add-signin`
 * skill wires Supabase email OTP.
 *
 * @returns The localized email verification page.
 * @example
 * <VerifyPage />
 */
const VerifyPage = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const emailId = useId();
  const codeId = useId();
  const { toast } = useToast();
  const router = useRouter();
  const t = useTranslations();
  const { loading: pending, error, run: submit } = useAsync(runAuthAction);

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const handleCodeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCode(event.target.value);
  }, []);

  const handleVerify = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage('');
      const result = await submit({ kind: 'verify', email, code });
      if (Either.isLeft(result)) {
        return;
      }
      router.push('/dashboard');
    },
    [code, email, router, submit],
  );

  const handleResend = useCallback(async () => {
    setMessage('');
    const result = await submit({ kind: 'resend', email });
    if (Either.isLeft(result)) {
      return;
    }
    const sent = t('auth.verify.codeSent');
    setMessage(sent);
    toast(sent);
  }, [email, submit, t, toast]);

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
          id={emailId}
          label={t('auth.verify.emailLabel')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={handleEmailChange}
          required={true}
        />
        <FormField
          id={codeId}
          label={t('auth.verify.codeLabel')}
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={handleCodeChange}
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
};

export default VerifyPage;
