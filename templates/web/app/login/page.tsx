'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { signInWithPassword } from '@/lib/auth-client';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

/**
 * Sign-in screen — full layout with loading + inline error states. The actual
 * sign-in is a marked stub until the `add-signin` skill wires `@vybekiit/auth`.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const result = await signInWithPassword(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    // TODO(vybekiit): send the signed-in builder to their dashboard — skill: add-signin
    window.location.href = '/dashboard';
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your account."
      footer={
        <>
          New here?{' '}
          <Link href="/signup" className="text-foreground underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
