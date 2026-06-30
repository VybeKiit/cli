import { MarketingShell } from '@/components/marketing-shell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/** Marketing copy for the three feature highlights below the hero. */
const FEATURES = [
  { title: 'Payments built in', body: 'Take money on day one — Lemon Squeezy, Stripe, or PayPal.' },
  {
    title: 'Your data, ready',
    body: 'A database and sign-in wired up without the setup headache.',
  },
  { title: 'Live in minutes', body: 'Deploy to the web with a custom domain when you are ready.' },
];

/**
 * Landing page — a starting point the agent reshapes to the builder's idea.
 * Pure layout: hero + feature highlights + CTA. Logical spacing mirrors in RTL.
 */
export default function HomePage() {
  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-24">
        <h1 className="text-balance font-bold text-5xl tracking-tight">Your app starts here.</h1>
        <p className="text-balance text-lg text-muted-foreground">
          Tell your AI agent what you want to build. It wires the payments, the database, and the
          deploy — you just describe the idea.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-3xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex flex-col gap-2">
            <h2 className="font-semibold">{feature.title}</h2>
            <p className="text-muted-foreground text-sm">{feature.body}</p>
          </div>
        ))}
      </section>
    </MarketingShell>
  );
}
