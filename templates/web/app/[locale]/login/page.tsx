'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Button } from '@vybekiit/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { Link, useRouter } from '@/i18n/navigation';
import { signInWithPassword } from '@/lib/authClient';
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
 * Sign-in screen — full layout with loading + inline error states. The actual
 * sign-in is a marked stub until the `add-signin` skill wires `@vybekiit/auth`.
 *
 * @returns The localized sign-in page.
 * @example
 * <LoginPage />
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const emailId = useId();
  const passwordId = useId();
  const { loading: pending, error, run: signIn } = useAsync(signInWithPassword);
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
      const result = await signIn(email, password);
      if (Either.isLeft(result)) {
        return;
      }
      router.push('/dashboard');
    },
    [email, password, router, signIn],
  );

  return (
    <AuthShell
      titleKey="auth.login.title"
      descriptionKey="auth.login.description"
      footer={
        <>
          {t('auth.login.footerPrefix')}{' '}
          <Link href="/signup" className="text-foreground underline">
            {t('auth.login.footerLink')}
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
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={handleEmailChange}
          required={true}
        />
        <FormField
          id={passwordId}
          label={t('auth.login.passwordLabel')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={handlePasswordChange}
          required={true}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
