import { Button } from '@/components/button';

/**
 * Default landing page — a starting point the agent reshapes to the buyer's idea.
 * Uses logical spacing (`ms-`, `gap-`) so it mirrors cleanly in RTL.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6">
      <h1 className="text-4xl font-bold tracking-tight">Your app starts here.</h1>
      <p className="text-lg opacity-80">
        Tell your AI agent what you want to build. It wires the payments, the database, and the
        deploy — you just describe the idea.
      </p>
      <div className="flex gap-3">
        <Button size="lg">Get started</Button>
        <Button size="lg" variant="outline">
          Learn more
        </Button>
      </div>
    </main>
  );
}
