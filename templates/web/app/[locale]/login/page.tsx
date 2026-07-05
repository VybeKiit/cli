'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Button } from '@vybekiit/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { Link, useRouter } from '@/i18n/navigation';
import { signInWithPassword } from '@/lib/authClient';
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
 * Sign-in screen — full layout with loading + inline error states. The actual
 * sign-in is a marked stub until the `add-signin` skill wires `@vybekiit/auth`.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signIn } = useAsync(signInWithPassword);
  const router = useRouter();
  const t = useTranslations();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signIn(email, password);
    if (!result.ok) return;
    router.push('/dashboard');
  }

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
          id="email"
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required={true}
        />
        <FormField
          id="password"
          label={t('auth.login.passwordLabel')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required={true}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
