import { Badge } from '@vybekiit/ui/badge';
import { Textarea } from '@vybekiit/ui/textarea';
import { Lightbulb, Save } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';

/**
 * Render a source-backed idea planner page recipe.
 *
 * @returns A ready idea planning and data design page component.
 * @example
 * const element = <IdeaPlannerPage />;
 */
export const IdeaPlannerPage = () => {
  // TODO: Save idea notes to the configured app data store.
  // TODO: Turn approved entities into the active database schema plan.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <Badge className="mb-4" variant="secondary">
          Planning
        </Badge>
        <h1 className="font-bold text-4xl tracking-tight">Plan your app idea</h1>
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border bg-card p-5">
            <Lightbulb className="mb-4 h-6 w-6 text-amber-600" />
            <Textarea
              className="min-h-48"
              defaultValue="I want to help customers book, pay, and manage their work in one place."
            />
            <DemoActionButton className="mt-4" icon={<Save className="h-4 w-4" />}>
              Save plan
            </DemoActionButton>
          </div>
          <aside className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold text-xl">Suggested data</h2>
            <div className="mt-4 space-y-2">
              {['Customers', 'Orders', 'Messages'].map((entity) => (
                <div className="rounded-md border px-3 py-2 text-sm" key={entity}>
                  {entity}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};
