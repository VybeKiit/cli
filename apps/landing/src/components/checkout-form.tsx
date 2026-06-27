'use client';

import { FormField } from '@/components/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PRICE } from '@/data/site';
import { postJson } from '@/lib/fetch-json';
import { isValidEmail, isValidGithubUsername } from '@/lib/validation';
import { type FormEvent, useState } from 'react';

/** The JSON the checkout route returns on success. */
interface CheckoutResponse {
  readonly url: string;
}

/** Per-field inline errors; empty string means no error (no `undefined` under EOPT). */
interface FieldErrors {
  githubUsername: string;
  email: string;
}

const NO_FIELD_ERRORS: FieldErrors = { githubUsername: '', email: '' };

/**
 * Checkout form — collects the buyer's GitHub username (the gate's key) and email,
 * validates both inline (the real GitHub username rule + a basic email check) via
 * the shared `FormField` pattern, then POSTs to `/api/checkout`. On `{ url }` it
 * redirects to the hosted checkout; on failure it shows a visible error and keeps
 * the form usable. The GitHub username is collected here because the gate invites
 * that exact account once payment clears — there is no account system of our own.
 */
export function CheckoutForm() {
  const [githubUsername, setGithubUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(NO_FIELD_ERRORS);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    return {
      githubUsername: isValidGithubUsername(githubUsername)
        ? ''
        : 'Enter a valid GitHub username (letters, numbers, single hyphens).',
      email: isValidEmail(email) ? '' : 'Enter a valid email address.',
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError('');

    const errors = validate();
    setFieldErrors(errors);
    if (errors.githubUsername || errors.email) return;

    setSubmitting(true);
    const result = await postJson<CheckoutResponse>('/api/checkout', { githubUsername, email });
    if (result.ok) {
      // Leave `submitting` true: we are navigating away to the hosted checkout.
      window.location.assign(result.value.url);
      return;
    }
    setSubmitError(result.error.message);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <FormField
        id="githubUsername"
        label="GitHub username"
        autoComplete="username"
        placeholder="octocat"
        value={githubUsername}
        onChange={(event) => setGithubUsername(event.target.value)}
        error={fieldErrors.githubUsername}
      />
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
      />
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Starting checkout…' : `Continue to payment — ${PRICE.display}`}
      </Button>
      <p className="text-muted-foreground text-xs">
        We invite this GitHub account to the private repo the moment payment clears. Refundable for{' '}
        {PRICE.refundDays} days.
      </p>
    </form>
  );
}
