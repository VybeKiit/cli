'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Button } from '@vybekiit/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { Link, useRouter } from '@/i18n/navigation';
import { signUpWithPassword } from '@/lib/authClient';
import { Either } from 'effect';
import { useTranslations } from 'next-intl';
import { type ChangeEvent, type FormEvent, useCallback, useId, useState } from 'react';

/** Show a catalog key or pass through a server error message. */
const displayError = (t: ReturnType<typeof useTranslations>, error: string): string => {
  try {
    return t(error as 'auth.errors.enterEmailAndPassword');
  } catch {
    return error;
  }
};

/**
 * Sign-up screen — full layout with loading + inline error states. Account
 * creation is a marked stub until the `add-signin` skill wires `@vybekiit/auth`.
 *
 * @returns The localized sign-up page.
 * @example
 * <SignupPage />
 */
const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailId = useId();
  const passwordId = useId();
  const { loading: pending, error, run: signUp } = useAsync(signUpWithPassword);
  const router = useRouter();
  const t = useTranslations();

  const handleEmailChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  }, []);

  const handlePasswordChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = await signUp(email, password);
      if (Either.isLeft(result)) {
        return;
      }
      router.push('/verify');
    },
    [email, password, router, signUp],
  );

  return (
    <AuthShell
      titleKey="auth.signup.title"
      descriptionKey="auth.signup.description"
      footer={
        <>
          {t('auth.signup.footerPrefix')}{' '}
          <Link href="/login" className="text-foreground underline">
            {t('auth.signup.footerLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{displayError(t, error)}</AlertDescription>
          </Alert>
        ) : null}
        <FormField
          id={emailId}
          label={t('auth.signup.emailLabel')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={handleEmailChange}
          required={true}
        />
        <FormField
          id={passwordId}
          label={t('auth.signup.passwordLabel')}
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={handlePasswordChange}
          required={true}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>
    </AuthShell>
  );
};

export default SignupPage;
