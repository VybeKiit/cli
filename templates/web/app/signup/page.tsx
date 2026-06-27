'use client';

import { AuthShell } from '@/components/auth-shell';
import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { signUpWithPassword } from '@/lib/auth-client';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';

/**
 * Sign-up screen — full layout with loading + inline error states. Account
 * creation is a marked stub until the `add-signin` skill wires `@vybekiit/auth`.
 */
export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    const result = await signUpWithPassword(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    // TODO(vybekiit): after sign-up, send the builder to verify their email — skill: add-signin
    window.location.href = '/verify';
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start building in a couple of minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-foreground underline">
            Sign in
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
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
