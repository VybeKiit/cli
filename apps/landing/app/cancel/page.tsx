import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Checkout canceled — VybeKiit',
};

/**
 * Post-checkout cancel state. Reached when the buyer backs out of the hosted
 * checkout. No charge was made; offer a clear path back to try again.
 */
export default function CancelPage() {
  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-xl flex-col items-start gap-6 px-6 py-24">
        <h1 className="font-bold text-4xl tracking-tight">Checkout canceled</h1>
        <p className="text-lg text-muted-foreground">
          No charge was made. Whenever you are ready, you can pick up right where you left off.
        </p>
        <Button asChild={true} size="lg">
          <Link href="/checkout">Try again</Link>
        </Button>
      </section>
    </MarketingShell>
  );
}
