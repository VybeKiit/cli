'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Button } from '@vybekiit/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { Link, useRouter } from '@/i18n/navigation';
import { signUpWithPassword } from '@/lib/authClient';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

/** Show a catalog key or pass through a server error message. */
function displayError(t: ReturnType<typeof useTranslations>, error: string): string {
  try {
    return t(error as 'auth.errors.enterEmailAndPassword');
  } catch {
    return error;
  }
}

/**
 * Sign-up screen — full layout with loading + inline error states. Account
 * creation is a marked stub until the `add-signin` skill wires `@vybekiit/auth`.
 */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signUp } = useAsync(signUpWithPassword);
  const router = useRouter();
  const t = useTranslations();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signUp(email, password);
    if (!result.ok) return;
    router.push('/verify');
  }

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
          id="email"
          label={t('auth.signup.emailLabel')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required={true}
        />
        <FormField
          id="password"
          label={t('auth.signup.passwordLabel')}
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required={true}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t('auth.signup.submitting') : t('auth.signup.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
