import { Badge } from '@vybekiit/ui/badge';
import { ArrowRight, CheckCircle2, Palette, Sparkles } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './shared/DemoVariantGrid';

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
    <DemoThemeRandomizer>
      <DemoTransitionStage defaultTransition="slide" title="App onboarding motion">
        <main className="min-h-screen bg-background px-4 py-10 text-foreground">
          <section className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border bg-card p-6">
              <Badge className="mb-4" variant="secondary">
                Start
              </Badge>
              <h1 className="font-bold text-4xl tracking-tight">Set up your app</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                A friendly first-run page for setup progress, kit updates, and next actions.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {['Describe the app', 'Pick a design direction', 'Connect the first feature'].map(
                  (label) => (
                    <div className="rounded-lg border p-4" key={label}>
                      <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" />
                      <span className="font-medium">{label}</span>
                      <p className="mt-2 text-muted-foreground text-sm">
                        Short, guided setup step with safe defaults.
                      </p>
                    </div>
                  ),
                )}
              </div>
              <DemoActionButton className="mt-6" icon={<ArrowRight className="h-4 w-4" />}>
                Continue setup
              </DemoActionButton>
            </div>

            <DemoVariantGrid
              description="Use these states to judge colors, type weight, and step density."
              title="Onboarding variants"
            >
              <DemoVariantCard label="Primary step" tone="primary">
                <Sparkles className="mb-2 h-5 w-5 text-primary" />
                <p className="font-semibold text-lg">One clear action</p>
                <p className="mt-1 text-muted-foreground text-sm">Large heading and one button.</p>
              </DemoVariantCard>
              <DemoVariantCard label="Dense step" tone="muted">
                <p className="font-medium text-sm">Checklist density</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Smaller copy for compact walkthrough cards.
                </p>
              </DemoVariantCard>
              <DemoVariantCard label="Color stress" tone="accent">
                <Palette className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">Randomized palette ready</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  Check contrast after every swap.
                </p>
              </DemoVariantCard>
            </DemoVariantGrid>
          </section>
        </main>
      </DemoTransitionStage>
    </DemoThemeRandomizer>
  );
};
