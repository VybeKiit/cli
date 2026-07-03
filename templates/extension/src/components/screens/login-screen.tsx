import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAsync } from '@/hooks/useAsync';
import { signInWithPassword } from '@/lib/authClient';
import { t } from '@/lib/i18n';
import type { ExtensionView } from '@/lib/view';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@vybekiit/client-state';
import { type FormEvent, useId, useState } from 'react';

export function LoginScreen({ onNavigate }: { onNavigate: (view: ExtensionView) => void }) {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading: pending, error, run: signIn } = useAsync(signInWithPassword);
  const queryClient = useQueryClient();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await signIn(email, password);
    if (!result.ok) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    onNavigate('home');
  }

  return (
    <AuthShell
      titleKey="auth_login_title"
      descriptionKey="auth_login_description"
      onBrandClick={() => onNavigate('home')}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FormField
          id={emailId}
          label={t('auth_login_emailLabel')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required={true}
        />
        <FormField
          id={passwordId}
          label={t('auth_login_passwordLabel')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required={true}
        />
        <Button type="submit" disabled={pending}>
          {pending ? t('auth_login_submitting') : t('auth_login_submit')}
        </Button>
      </form>
    </AuthShell>
  );
}
