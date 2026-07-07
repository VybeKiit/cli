import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { CheckCircle2 } from 'lucide-react';

/**
 * Render a source-backed onboarding page recipe.
 *
 * @returns A ready first-run setup page component.
 * @example
 * const element = <OnboardingPage />;
 */
export const OnboardingPage = () => {
  // TODO: Connect checklist progress to the user's saved setup state.
  // TODO: Connect update prompts to the kit update workflow.
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <section className="mx-auto max-w-4xl rounded-lg border bg-card p-6">
        <Badge className="mb-4" variant="secondary">
          Start
        </Badge>
        <h1 className="font-bold text-4xl tracking-tight">Set up your app</h1>
        <p className="mt-2 text-muted-foreground">
          A friendly first-run page for setup progress, kit updates, and next actions.
        </p>
        <div className="mt-6 space-y-3">
          {['Describe the app', 'Pick a design direction', 'Connect the first feature'].map(
            (label) => (
              <div className="flex items-center gap-3 rounded-lg border p-4" key={label}>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-medium">{label}</span>
              </div>
            ),
          )}
        </div>
        <Button className="mt-6" type="button">
          Continue setup
        </Button>
      </section>
    </main>
  );
};
