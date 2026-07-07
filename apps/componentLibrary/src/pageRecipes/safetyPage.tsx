import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 * Render a source-backed safety page recipe.
 *
 * @returns A ready safety, hardening, and doctor status page component.
 * @example
 * const element = <SafetyPage />;
 */
export const SafetyPage = () => {
  // TODO: Connect checks to the configured safety scanner and audit log.
  // TODO: Connect incident rows to the configured error tracking provider.
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <section className="mx-auto max-w-6xl">
        <Badge className="mb-4" variant="secondary">
          Safety
        </Badge>
        <h1 className="font-bold text-4xl tracking-tight">Ready to ship checklist</h1>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {['Sign-in protected', 'Secrets hidden', 'Error alerts connected'].map((label) => (
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4" key={label}>
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
          <aside className="rounded-lg border bg-card p-5">
            <ShieldAlert className="mb-3 h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-xl">Doctor status</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Use this page to show the one thing that needs attention before launch.
            </p>
            <Button className="mt-5 w-full" type="button">
              Run checks
            </Button>
          </aside>
        </div>
      </section>
    </main>
  );
};
