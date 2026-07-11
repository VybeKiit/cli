'use client';

import { Effect, Either } from 'effect';
import { type FormEvent, useRef, useState } from 'react';
import { FormField } from '@/components/FormField';
import { useLivePricing } from '@/components/LivePricingProvider';
import { BrandRichText } from '@/components/landing/BrandRichText';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PRICE } from '@/data/site';
import { fillTemplate } from '@/i18n/fillTemplate';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { identifyClient, trackClient } from '@/lib/analyticsClient';
import { AnalyticsEvent } from '@/lib/analyticsEvents';
import { postJson } from '@/lib/fetchJson';
import { isValidEmail, isValidGithubUsername } from '@/lib/validation';

/** The JSON the checkout route returns on success. */
interface CheckoutResponse {
  readonly url: string;
  readonly priceUsd?: number;
  readonly priceDisplay?: string;
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
  const { messages } = useLandingLocale();
  const { pricing: live } = useLivePricing();
  const checkout = messages.checkout;
  const [githubUsername, setGithubUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(NO_FIELD_ERRORS);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formStartedRef = useRef(false);
  const priceUsd = live.amount > 0 ? live.amount : PRICE.amount;
  const priceDisplay = live.display || PRICE.display;

  const markFormStarted = (field: 'githubUsername' | 'email'): void => {
    if (formStartedRef.current) {
      return;
    }
    formStartedRef.current = true;
    trackClient(AnalyticsEvent.checkoutFormStarted, { field });
  };

  const validate = (): FieldErrors => ({
    githubUsername: isValidGithubUsername(githubUsername) ? '' : checkout.githubError,
    email: isValidEmail(email) ? '' : checkout.emailError,
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
      price_usd: priceUsd,
      sale_count: live.saleCount,
    });

    setSubmitting(true);
    const result = await Effect.runPromise(
      Effect.either(postJson<CheckoutResponse>('/api/checkout', { githubUsername, email })),
    );
    if (Either.isRight(result)) {
      trackClient(AnalyticsEvent.checkoutSessionCreated, {
        price_usd: result.right.priceUsd ?? priceUsd,
        sale_count: live.saleCount,
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
        label={checkout.githubLabel}
        autoComplete="username"
        dir="ltr"
        placeholder={checkout.githubPlaceholder}
        value={githubUsername}
        onChange={(event) => setGithubUsername(event.target.value)}
        onFocus={() => markFormStarted('githubUsername')}
        error={fieldErrors.githubUsername}
      />
      <FormField
        id="email"
        label={checkout.emailLabel}
        type="email"
        autoComplete="email"
        dir="ltr"
        placeholder={checkout.emailPlaceholder}
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
        {submitting ? (
          <Spinner className="size-5" />
        ) : (
          <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
            <span>{checkout.submit}</span>
            <span className="tabular-nums" dir="ltr">
              · {priceDisplay}
            </span>
          </span>
        )}
      </Button>
      <p className="text-center text-muted-foreground text-xs leading-relaxed">
        <BrandRichText text={checkout.secureNote} />{' '}
        <strong className="font-semibold text-foreground">
          {fillTemplate(checkout.refundNote, { days: PRICE.refundDays })}
        </strong>
      </p>
    </form>
  );
};

export { CheckoutForm };
