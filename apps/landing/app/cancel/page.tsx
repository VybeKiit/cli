import { PageEvent } from '@/components/analytics/PageEvent';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { CheckoutShell } from '@/components/CheckoutShell';
import { TrustChips } from '@/components/TrustChips';
import { Button } from '@/components/ui/button';
import { AnalyticsEvent } from '@/lib/analyticsEvents';

export const metadata = {
  title: 'Checkout canceled — VybeKiit',
};

/**
 * Post-checkout cancel state. Reached when the buyer backs out of the hosted
 * checkout. No charge was made; offer a clear path back to try again.
 */
const CancelPage = () => (
  <CheckoutShell>
    <PageEvent event={AnalyticsEvent.checkoutCanceled} />
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-16 sm:py-24">
      <p className="text-muted-foreground text-sm">No charge was made</p>
      <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
        Checkout canceled
      </h1>
      <p className="text-balance text-lg text-muted-foreground leading-relaxed">
        Whenever you are ready, you can pick up right where you left off. The kit is still one
        purchase for web, mobile, and extension.
      </p>
      <TrustChips animate={false} />
      <div className="flex flex-wrap gap-3">
        <Button asChild={true} size="lg" className="rounded-full px-6">
          <TrackedLink
            href="/?checkout=1"
            location="cancel_retry"
            trackProperties={{ label: 'Try again' }}
          >
            Try again
          </TrackedLink>
        </Button>
        <Button asChild={true} size="lg" variant="outline" className="rounded-full px-6">
          <TrackedLink href="/" location="cancel_retry" trackProperties={{ label: 'Back to home' }}>
            Back to home
          </TrackedLink>
        </Button>
      </div>
    </section>
  </CheckoutShell>
);

export default CancelPage;
