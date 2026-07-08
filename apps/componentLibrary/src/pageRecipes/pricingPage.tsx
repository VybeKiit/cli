import { Badge } from '@vybekiit/ui/badge';
import { CheckCircle2, CreditCard, LineChart, Sparkles } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './shared/DemoVariantGrid';

const planFeatures = ['Checkout handoff', 'Customer portal link', 'Order webhook checklist'];
const plans = [
  { name: 'Starter', price: '29', featured: false },
  { name: 'Growth', price: '79', featured: true },
  { name: 'Scale', price: '149', featured: false },
];

/**
 * Render a source-backed pricing page recipe.
 *
 * @returns A ready pricing page component with provider-owned pricing notes.
 * @example
 * const element = <PricingPage />;
 */
export const PricingPage = () => {
  // TODO: Read plans from the active payment provider configuration.
  // TODO: Send checkout clicks to the configured payments checkout route.
  return (
    <DemoThemeRandomizer>
      <DemoTransitionStage defaultTransition="scale" title="Pricing motion pass">
        <main className="min-h-screen bg-background px-4 py-10 text-foreground">
          <section className="mx-auto max-w-6xl">
            <div className="max-w-2xl space-y-4">
              <Badge className="w-fit" variant="secondary">
                Payments
              </Badge>
              <h1 className="font-bold text-4xl tracking-tight md:text-5xl">
                Pick the plan that fits your launch
              </h1>
              <p className="text-muted-foreground">
                Prices shown here are safe defaults for the recipe preview. Live prices belong in
                the active payment provider and app config.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article className="rounded-lg border bg-card p-5 shadow-sm" key={plan.name}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-xl">{plan.name}</h2>
                      <p className="mt-1 text-muted-foreground text-sm">
                        Default display tier for local preview.
                      </p>
                    </div>
                    {plan.featured ? <Badge>Popular</Badge> : null}
                  </div>
                  <p className="mt-6 font-bold text-3xl">${plan.price}</p>
                  <p className="text-muted-foreground text-sm">per month</p>
                  <ul className="mt-5 space-y-3 text-sm">
                    {planFeatures.map((feature) => (
                      <li className="flex items-center gap-2" key={feature}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <DemoActionButton
                    className="mt-6 w-full"
                    icon={<CreditCard className="h-4 w-4" />}
                    variant={plan.featured ? 'default' : 'outline'}
                  >
                    Start checkout
                  </DemoActionButton>
                </article>
              ))}
            </div>

            <DemoVariantGrid
              className="mt-6"
              description="Compare sales-card emphasis before copying the page into a template."
              title="Pricing variants"
            >
              <DemoVariantCard label="Hero price" tone="primary">
                <p className="font-bold text-4xl">$79</p>
                <p className="text-muted-foreground text-sm">Large, conversion-focused type.</p>
              </DemoVariantCard>
              <DemoVariantCard label="Trust row" tone="muted">
                <Sparkles className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">Includes setup checklist</p>
                <p className="text-muted-foreground text-sm">Good for lower-friction pricing.</p>
              </DemoVariantCard>
              <DemoVariantCard label="Metric card" tone="accent">
                <LineChart className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">12 checkout events</p>
                <p className="text-muted-foreground text-sm">Preview billing dashboard density.</p>
              </DemoVariantCard>
            </DemoVariantGrid>
          </section>
        </main>
      </DemoTransitionStage>
    </DemoThemeRandomizer>
  );
};
