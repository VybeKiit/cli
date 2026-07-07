import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Activity, BarChart3 } from 'lucide-react';

/**
 * Render a source-backed analytics page recipe.
 *
 * @returns A ready analytics and error tracking page component.
 * @example
 * const element = <AnalyticsPage />;
 */
export const AnalyticsPage = () => {
  // TODO: Connect usage totals to the configured analytics provider.
  // TODO: Connect error alerts to the configured tracking provider.
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <section className="mx-auto max-w-6xl">
        <Badge className="mb-4" variant="secondary">
          Analytics
        </Badge>
        <h1 className="font-bold text-4xl tracking-tight">Product health</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {['Visitors', 'Signups', 'Errors'].map((label, index) => (
            <article className="rounded-lg border bg-card p-5" key={label}>
              {index === 2 ? (
                <Activity className="mb-3 h-5 w-5 text-rose-600" />
              ) : (
                <BarChart3 className="mb-3 h-5 w-5 text-blue-600" />
              )}
              <p className="text-muted-foreground text-sm">{label}</p>
              <p className="mt-2 font-bold text-3xl">{index === 2 ? '0' : 'Ready'}</p>
            </article>
          ))}
        </div>
        <Button className="mt-6" type="button">
          Open report
        </Button>
      </section>
    </main>
  );
};
