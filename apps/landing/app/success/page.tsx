import { PageEvent } from '@/components/analytics/PageEvent';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { CheckoutShell } from '@/components/CheckoutShell';
import { TrustChips } from '@/components/TrustChips';
import { Button } from '@/components/ui/button';
import { SUPPORT } from '@/data/site';
import { AnalyticsEvent } from '@/lib/analyticsEvents';

export const metadata = {
  title: 'You are in — VybeKiit',
};

/**
 * Post-checkout success state. Payment cleared; the gate webhook invites the buyer's
 * GitHub account asynchronously, so we point them at their email for the invite
 * rather than implying instant repo access.
 */
const SuccessPage = () => (
  <CheckoutShell>
    <PageEvent event={AnalyticsEvent.purchaseCompleted} />
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-16 sm:py-24">
      <p className="text-emerald-600 text-sm font-medium">Payment received</p>
      <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
        You are in. Welcome to the kit.
      </h1>
      <p className="text-balance text-lg text-muted-foreground leading-relaxed">
        Check your email for the GitHub invite to the private repo. It arrives within a few minutes
        of payment clearing. Accept it, then point your agent at the repo and describe what you want
        to build.
      </p>
      <TrustChips animate={false} />
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
