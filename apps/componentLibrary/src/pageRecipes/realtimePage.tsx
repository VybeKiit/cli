import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { RadioTower } from 'lucide-react';

/**
 * Render a source-backed realtime page recipe.
 *
 * @returns A ready live activity page component.
 * @example
 * const element = <RealtimePage />;
 */
export const RealtimePage = () => {
  // TODO: Subscribe to the configured realtime publication.
  // TODO: Replace default activity labels with live events from the database.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl rounded-lg border bg-card p-6">
        <Badge className="mb-4" variant="secondary">
          Realtime
        </Badge>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-bold text-4xl tracking-tight">Live activity</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              A starter page for updates that appear without refreshing the browser.
            </p>
          </div>
          <Button type="button" variant="outline">
            Refresh channel
          </Button>
        </div>
        <div className="mt-6 space-y-3">
          {['Connected', 'Listening for updates', 'Ready for first event'].map((label) => (
            <div className="flex items-center gap-3 rounded-lg border p-3" key={label}>
              <RadioTower className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
