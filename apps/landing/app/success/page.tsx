import { PageEvent } from '@/components/analytics/PageEvent';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { CheckoutShell } from '@/components/CheckoutShell';
import { TrustChips } from '@/components/TrustChips';
import { Button } from '@/components/ui/button';
import {
  POST_PURCHASE_AGENT_FROM_INVITE,
  POST_PURCHASE_DO_NOT,
  POST_PURCHASE_STEPS,
} from '@/data/postPurchase';
import { SUPPORT } from '@/data/site';
import { AnalyticsEvent } from '@/lib/analyticsEvents';

export const metadata = {
  title: 'You are in — VybeKiit',
  description:
    'Payment received. Accept your GitHub invite, run the starter commands, and paste the ready prompt into your AI coding tool.',
};

/**
 * Post-checkout success state. Payment cleared; the gate webhook invites the buyer's
 * GitHub account asynchronously. This page is the session-1 ladder for vibe coders who
 * may never have used GitHub before — not a vague "point your agent at the repo."
 */
const SuccessPage = () => (
  <CheckoutShell>
    <PageEvent event={AnalyticsEvent.purchaseCompleted} />
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-8 px-6 py-16 sm:py-24">
      <div className="flex flex-col gap-4">
        <p className="text-emerald-600 text-sm font-medium">Payment received</p>
        <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
          You are in. Let&apos;s get your app on your computer.
        </h1>
        <p className="text-balance text-lg text-muted-foreground leading-relaxed">
          Check your email for the GitHub invite (usually within a few minutes). Accept it, then
          follow the steps below in order. One step at a time is enough.
        </p>
      </div>

      <TrustChips animate={false} />

      <ol className="flex w-full list-none flex-col gap-6 p-0">
        {POST_PURCHASE_STEPS.map((step, index) => (
          <li
            className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm"
            key={step.title}
          >
            <p className="mb-2 font-semibold text-sm text-muted-foreground">Step {index + 1}</p>
            <h2 className="mb-2 font-semibold text-xl tracking-tight">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{step.body}</p>
            {step.code === undefined ? null : (
              <pre className="mt-4 overflow-x-auto rounded-xl bg-muted/80 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {step.code}
              </pre>
            )}
          </li>
        ))}
      </ol>

      <div className="w-full rounded-2xl border border-border bg-muted/30 px-5 py-5">
        <h2 className="mb-3 font-semibold text-lg tracking-tight">
          Prefer your AI helper to do it?
        </h2>
        <p className="mb-3 text-muted-foreground leading-relaxed">
          After you accept the invite and have Node installed, open your AI coding tool anywhere and
          paste this whole block:
        </p>
        <pre className="overflow-x-auto rounded-xl bg-card p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          {POST_PURCHASE_AGENT_FROM_INVITE}
        </pre>
      </div>

      <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-5">
        <h2 className="mb-3 font-semibold text-lg tracking-tight">
          If you land on a GitHub Code button
        </h2>
        <ul className="list-disc space-y-2 ps-5 text-muted-foreground leading-relaxed">
          {POST_PURCHASE_DO_NOT.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        Kit questions? Email{' '}
        <TrackedLink
          className="text-foreground underline-offset-4 hover:underline"
          href={`mailto:${SUPPORT.kitEmail}`}
          location="support_email"
          trackProperties={{ channel: 'email' }}
        >
          {SUPPORT.kitEmail}
        </TrackedLink>
        {SUPPORT.discordUrl ? (
          <>
            {' '}
            or join{' '}
            <TrackedLink
              className="text-foreground underline-offset-4 hover:underline"
              href={SUPPORT.discordUrl}
              location="support_discord"
              trackProperties={{ channel: 'discord' }}
            >
              our Discord
            </TrackedLink>
          </>
        ) : null}
        . Kit bugs only; we do not debug custom app code.
      </p>

      <Button asChild={true} size="lg" className="rounded-full px-6">
        <TrackedLink href="/" location="success_home" trackProperties={{ label: 'Back to home' }}>
          Back to home
        </TrackedLink>
      </Button>
    </section>
  </CheckoutShell>
);

export default SuccessPage;
