import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Switch } from '@vybekiit/ui/switch';
import { Flag } from 'lucide-react';

/**
 * Render a source-backed feature flags page recipe.
 *
 * @returns A ready feature flag management page component.
 * @example
 * const element = <FeatureFlagsPage />;
 */
export const FeatureFlagsPage = () => {
  // TODO: Load flags from the configured feature flag source.
  // TODO: Save flag changes through the feature flags preset.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-5xl rounded-lg border bg-card p-6">
        <Badge className="mb-4" variant="secondary">
          Feature flags
        </Badge>
        <div className="flex items-center gap-3">
          <Flag className="h-7 w-7 text-emerald-600" />
          <h1 className="font-bold text-4xl tracking-tight">Control releases</h1>
        </div>
        <div className="mt-6 space-y-3">
          {['New checkout', 'Beta dashboard', 'AI assistant'].map((label, index) => (
            <div className="flex items-center justify-between rounded-lg border p-4" key={label}>
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground text-sm">Default flag row for setup.</p>
              </div>
              <Switch defaultChecked={index === 0} />
            </div>
          ))}
        </div>
        <Button className="mt-6" type="button">
          Save flags
        </Button>
      </section>
    </main>
  );
};
