import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';
import { SUPPORT } from '@/data/site';
import Link from 'next/link';

export const metadata = {
  title: 'You are in — VybeKiit',
};

/**
 * Post-checkout success state. Payment cleared; the gate webhook invites the buyer's
 * GitHub account asynchronously, so we point them at their email for the invite
 * rather than implying instant repo access.
 */
export default function SuccessPage() {
  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-xl flex-col items-start gap-6 px-6 py-24">
        <h1 className="font-bold text-4xl tracking-tight">Payment received. You are in.</h1>
        <p className="text-lg text-muted-foreground">
          Check your email for the GitHub invite to the private repo — it arrives within a few
          minutes of payment clearing. Accept it, then point your agent at the repo and describe
          what you want to build.
        </p>
        <p className="text-muted-foreground text-sm">
          Kit questions? Email{' '}
          <a
            className="text-foreground underline-offset-4 hover:underline"
            href={`mailto:${SUPPORT.kitEmail}`}
          >
            {SUPPORT.kitEmail}
          </a>
          {SUPPORT.discordUrl ? (
            <>
              {' '}
              or join{' '}
              <a
                className="text-foreground underline-offset-4 hover:underline"
                href={SUPPORT.discordUrl}
              >
                our Discord
              </a>
            </>
          ) : null}{' '}
          — kit bugs only; we do not debug custom app code.
        </p>
        <Button asChild={true} size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </section>
    </MarketingShell>
  );
}
