import { Badge } from '@vybekiit/ui/badge';
import { Activity, BarChart3, Download, Gauge, TrendingUp } from 'lucide-react';
import { DemoActionButton } from './shared/DemoActionButton';
import { DemoAppShell } from './shared/DemoAppShell';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './shared/DemoVariantGrid';

const metrics = [
  { label: 'Visitors', value: '12.8k', trend: '+18%', tone: 'blue' },
  { label: 'Signups', value: '842', trend: '+9%', tone: 'emerald' },
  { label: 'Errors', value: '0', trend: 'Clean', tone: 'rose' },
];

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
    <DemoThemeRandomizer>
      <DemoTransitionStage defaultTransition="blur" title="Analytics motion pass">
        <DemoAppShell active="analytics" title="Product health">
          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="mb-4" variant="secondary">
                  Analytics
                </Badge>
                <p className="max-w-2xl text-muted-foreground">
                  Monitor usage, conversion, and error health from one signed-in dashboard surface.
                </p>
              </div>
              <DemoActionButton icon={<Download className="h-4 w-4" />} variant="outline">
                Export report
              </DemoActionButton>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {metrics.map((metric) => (
                <article className="rounded-lg border bg-card p-5" key={metric.label}>
                  {metric.label === 'Errors' ? (
                    <Activity className="mb-3 h-5 w-5 text-rose-600" />
                  ) : (
                    <BarChart3 className="mb-3 h-5 w-5 text-blue-600" />
                  )}
                  <p className="text-muted-foreground text-sm">{metric.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="font-bold text-3xl">{metric.value}</p>
                    <Badge variant="secondary">{metric.trend}</Badge>
                  </div>
                </article>
              ))}
            </div>

            <DemoVariantGrid
              className="mt-6"
              description="Stress-test metric cards across color, density, and font scale."
              title="Analytics component variants"
            >
              <DemoVariantCard label="Large KPI" tone="primary">
                <TrendingUp className="mb-2 h-5 w-5 text-primary" />
                <p className="font-bold text-4xl">68%</p>
                <p className="text-muted-foreground text-sm">Activation rate</p>
              </DemoVariantCard>
              <DemoVariantCard label="Compact KPI" tone="muted">
                <Gauge className="mb-2 h-5 w-5 text-primary" />
                <p className="font-semibold text-xl">Fast</p>
                <p className="text-muted-foreground text-xs">Small-card health label.</p>
              </DemoVariantCard>
              <DemoVariantCard label="Alert KPI">
                <Activity className="mb-2 h-5 w-5 text-rose-600" />
                <p className="font-medium">No production errors</p>
                <p className="text-muted-foreground text-sm">Keeps red state readable.</p>
              </DemoVariantCard>
            </DemoVariantGrid>
          </section>
        </DemoAppShell>
      </DemoTransitionStage>
    </DemoThemeRandomizer>
  );
};
