import { Badge } from '@vybekiit/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Progress } from '@vybekiit/ui/progress';
import { Separator } from '@vybekiit/ui/separator';
import { Switch } from '@vybekiit/ui/switch';
import type { ReactElement } from 'react';
import { DemoActionButton } from './DemoActionButton';
import { DemoAppShell, type DemoAppShellSection } from './DemoAppShell';
import { DemoThemeRandomizer } from './DemoThemeRandomizer';
import { DemoTransitionStage } from './DemoTransitionStage';
import { DemoVariantCard, DemoVariantGrid } from './DemoVariantGrid';

interface DemoQuickWinMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: ReactElement;
  readonly tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
}

interface DemoQuickWinItem {
  readonly title: string;
  readonly description: string;
  readonly badge: string;
}

interface DemoQuickWinAction {
  readonly label: string;
  readonly icon: ReactElement;
  readonly variant?: 'default' | 'outline' | 'secondary';
}

interface DemoQuickWinPageProps {
  readonly active: DemoAppShellSection;
  readonly badge: string;
  readonly detailItems: readonly DemoQuickWinItem[];
  readonly detailTitle: string;
  readonly eyebrow?: string;
  readonly listDescription: string;
  readonly listItems: readonly DemoQuickWinItem[];
  readonly listTitle: string;
  readonly metrics: readonly DemoQuickWinMetric[];
  readonly primaryAction: DemoQuickWinAction;
  readonly secondaryAction: DemoQuickWinAction;
  readonly summary: string;
  readonly title: string;
  readonly transition?: 'fade' | 'slide' | 'scale' | 'blur';
  readonly variantDescription: string;
  readonly variantItems: readonly DemoQuickWinItem[];
  readonly variantTitle: string;
}

const metricToneClassNames: Record<DemoQuickWinMetric['tone'], string> = {
  amber: 'text-amber-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
  slate: 'text-slate-600',
  violet: 'text-violet-600',
};

const resolveVariantTone = (index: number): 'primary' | 'accent' | 'muted' => {
  if (index === 0) {
    return 'primary';
  }
  if (index === 1) {
    return 'accent';
  }
  return 'muted';
};

/**
 * Render a reusable SaaS page recipe scaffold for quick-win pages.
 *
 * @param props - Page copy, active shell section, metrics, action buttons, and card content.
 * @returns A complete source-backed page recipe with motion, theme randomization, and loading actions.
 * @example
 * const element = <DemoQuickWinPage active="settings" badge="Settings" title="User settings" summary="Account controls" metrics={[]} listTitle="Profile" listDescription="Profile controls" listItems={[]} detailTitle="Security" detailItems={[]} variantTitle="States" variantDescription="State cards" variantItems={[]} primaryAction={{ label: 'Save', icon: <Save /> }} secondaryAction={{ label: 'Preview', icon: <Eye />, variant: 'outline' }} />;
 */
export const DemoQuickWinPage = ({
  active,
  badge,
  detailItems,
  detailTitle,
  eyebrow = 'Signed in',
  listDescription,
  listItems,
  listTitle,
  metrics,
  primaryAction,
  secondaryAction,
  summary,
  title,
  transition = 'fade',
  variantDescription,
  variantItems,
  variantTitle,
}: DemoQuickWinPageProps) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition={transition} title={`${title} motion pass`}>
      <DemoAppShell active={active} eyebrow={eyebrow} title={title}>
        <section className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge className="mb-4" variant="secondary">
                {badge}
              </Badge>
              <p className="max-w-3xl text-muted-foreground">{summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DemoActionButton icon={secondaryAction.icon} variant={secondaryAction.variant}>
                {secondaryAction.label}
              </DemoActionButton>
              <DemoActionButton icon={primaryAction.icon} variant={primaryAction.variant}>
                {primaryAction.label}
              </DemoActionButton>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card className="rounded-lg" key={metric.label}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardDescription>{metric.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle>
                  </div>
                  <span className={metricToneClassNames[metric.tone]}>{metric.icon}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{metric.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>{listTitle}</CardTitle>
                <CardDescription>{listDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {listItems.map((item) => (
                  <div
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    key={item.title}
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-muted-foreground text-sm">{item.description}</p>
                    </div>
                    <Badge variant="outline">{item.badge}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>{detailTitle}</CardTitle>
                <CardDescription>Default controls and states for this route.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {detailItems.map((item, index) => (
                  <div className="space-y-3" key={item.title}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="mt-1 text-muted-foreground text-xs">{item.description}</p>
                      </div>
                      <Switch defaultChecked={index !== detailItems.length - 1} />
                    </div>
                    <Progress value={85 - index * 18} />
                    {index < detailItems.length - 1 ? <Separator /> : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <DemoVariantGrid description={variantDescription} title={variantTitle}>
            {variantItems.map((item, index) => (
              <DemoVariantCard key={item.title} label={item.badge} tone={resolveVariantTone(index)}>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-muted-foreground text-sm">{item.description}</p>
              </DemoVariantCard>
            ))}
          </DemoVariantGrid>
        </section>
      </DemoAppShell>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
