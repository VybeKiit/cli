'use client';

import { Effect, Either } from 'effect';
import { type FormEvent, useRef, useState } from 'react';
import { FormField } from '@/components/FormField';
import { BrandRichText } from '@/components/landing/BrandRichText';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PRICE } from '@/data/site';
import { identifyClient, trackClient } from '@/lib/analyticsClient';
import { AnalyticsEvent } from '@/lib/analyticsEvents';
import { postJson } from '@/lib/fetchJson';
import { isValidEmail, isValidGithubUsername } from '@/lib/validation';

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
 *
 * @returns The checkout form React element.
 * @example
 * <CheckoutForm />
 */
const CheckoutForm = () => {
  const [githubUsername, setGithubUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(NO_FIELD_ERRORS);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formStartedRef = useRef(false);

  const markFormStarted = (field: 'githubUsername' | 'email'): void => {
    if (formStartedRef.current) {
      return;
    }
    formStartedRef.current = true;
    trackClient(AnalyticsEvent.checkoutFormStarted, { field });
  };

  const validate = (): FieldErrors => ({
    githubUsername: isValidGithubUsername(githubUsername)
      ? ''
      : 'Enter a valid GitHub username (letters, numbers, single hyphens).',
    email: isValidEmail(email) ? '' : 'Enter a valid email address.',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitError('');

    const errors = validate();
    setFieldErrors(errors);
    if (errors.githubUsername || errors.email) {
      const failedFields = [
        errors.githubUsername ? 'githubUsername' : null,
        errors.email ? 'email' : null,
      ].filter((field): field is string => field !== null);
      trackClient(AnalyticsEvent.checkoutValidationFailed, {
        fields: failedFields.join(','),
      });
      return;
    }

    identifyClient(email, { github_username: githubUsername.trim() });
    trackClient(AnalyticsEvent.checkoutSubmitted, {
      price_usd: PRICE.amount,
    });

    setSubmitting(true);
    const result = await Effect.runPromise(
      Effect.either(postJson<CheckoutResponse>('/api/checkout', { githubUsername, email })),
    );
    if (Either.isRight(result)) {
      trackClient(AnalyticsEvent.checkoutSessionCreated, {
        price_usd: PRICE.amount,
      });
      // Leave `submitting` true: we are navigating away to the hosted checkout.
      window.location.assign(result.right.url);
      return;
    }
    trackClient(AnalyticsEvent.checkoutSessionFailed, {
      error: result.left.message,
    });
    setSubmitError(result.left.message);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate={true} className="flex flex-col gap-5">
      <FormField
        id="githubUsername"
        label="GitHub username"
        autoComplete="username"
        placeholder="octocat"
        value={githubUsername}
        onChange={(event) => setGithubUsername(event.target.value)}
        onFocus={() => markFormStarted('githubUsername')}
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
        onFocus={() => markFormStarted('email')}
        error={fieldErrors.email}
      />
      {submitError ? (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        aria-busy={submitting}
        className="w-full rounded-full"
      >
        {submitting ? <Spinner className="size-5" /> : `Continue to payment · ${PRICE.display}`}
      </Button>
      <p className="text-center text-muted-foreground text-xs leading-relaxed">
        <BrandRichText text="Secure checkout via Lemon Squeezy." />{' '}
        <strong className="font-semibold text-foreground">
          Refundable for {PRICE.refundDays} days, no questions asked.
        </strong>
      </p>
    </form>
  );
};

export { CheckoutForm };
