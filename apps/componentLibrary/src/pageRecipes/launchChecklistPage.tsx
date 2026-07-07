import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Rocket } from 'lucide-react';

/**
 * Render a source-backed launch checklist page recipe.
 *
 * @returns A ready go-live, domain, backup, and job status page component.
 * @example
 * const element = <LaunchChecklistPage />;
 */
export const LaunchChecklistPage = () => {
  // TODO: Connect deployment status to the configured hosting provider.
  // TODO: Connect scheduled job status to the jobs feature.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl rounded-lg border bg-card p-6">
        <Badge className="mb-4" variant="secondary">
          Go live
        </Badge>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-4xl tracking-tight">Launch checklist</h1>
            <p className="mt-2 text-muted-foreground">
              One page for domain, backup, deployment, and scheduled job readiness.
            </p>
          </div>
          <Rocket className="h-10 w-10 text-blue-600" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {['Back up code', 'Connect domain', 'Put app online', 'Check scheduled jobs'].map(
            (label) => (
              <div className="rounded-lg border p-4" key={label}>
                <p className="font-medium">{label}</p>
                <p className="mt-1 text-muted-foreground text-sm">Ready for provider wiring.</p>
              </div>
            ),
          )}
        </div>
        <Button className="mt-6" type="button">
          Continue launch
        </Button>
      </section>
    </main>
  );
};
