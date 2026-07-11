import {
  Activity,
  Archive,
  Bell,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  KanbanSquare,
  LifeBuoy,
  Package,
  Plug,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Progress } from '@vybekiit/ui/progress';
import { Separator } from '@vybekiit/ui/separator';

import type {
  SaasIconName,
  SaasPageAction,
  SaasPageDefinition,
  SaasPageItem,
} from '@/data/saasPageTypes';

const iconComponents: Readonly<Record<SaasIconName, LucideIcon>> = {
  activity: Activity,
  archive: Archive,
  bell: Bell,
  calendar: CalendarDays,
  cart: ShoppingCart,
  check: CheckCircle2,
  'credit-card': CreditCard,
  file: FileText,
  kanban: KanbanSquare,
  'life-buoy': LifeBuoy,
  package: Package,
  plug: Plug,
  settings: Settings,
  shield: ShieldCheck,
  sparkles: Sparkles,
  users: Users,
};

export interface SaasPageViewProps {
  readonly definition: SaasPageDefinition;
  readonly surface?: 'public' | 'dashboard';
}

export interface SaasIconProps {
  readonly name: SaasIconName;
  readonly className?: string;
}

/**
 * Render a supported SaaS route icon by key.
 *
 * @param props - Icon key and optional class name.
 * @returns The matching Lucide icon.
 * @example
 * <SaasIcon name="settings" className="h-4 w-4" />
 */
export const SaasIcon = ({ name, className = 'h-4 w-4' }: SaasIconProps) => {
  const Icon = iconComponents[name];
  return <Icon className={className} />;
};

/**
 * Render one buyer-ready SaaS page from a typed route definition.
 *
 * @param props - Page definition plus the public or dashboard surface flag.
 * @returns The complete SaaS page with metrics, lists, actions, and implementation checklist.
 * @example
 * <SaasPageView definition={page} surface="dashboard" />
 */
export const SaasPageView = ({ definition, surface = 'public' }: SaasPageViewProps) => (
  <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
    <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
      <div className="space-y-4">
        <Badge variant={surface === 'dashboard' ? 'default' : 'secondary'}>
          {definition.eyebrow}
        </Badge>
        <div className="space-y-3">
          <h1 className="font-bold text-4xl tracking-tight">{definition.title}</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">{definition.summary}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton action={definition.primaryAction} />
          <ActionButton action={definition.secondaryAction} />
        </div>
      </div>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardDescription>Route map</CardDescription>
          <CardTitle className="text-2xl">Starter layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={40} />
          <p className="text-muted-foreground text-sm">
            Long-tail surface map. Ask the agent to install the matching page recipe, or open a
            Tier-1 route (settings, teams, orders, integrations) for a full interactive UI.
          </p>
        </CardContent>
      </Card>
    </header>

    <section className="grid gap-4 md:grid-cols-3">
      {definition.metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle>
            </div>
            <MetricIcon name={metric.icon} />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">{metric.detail}</p>
          </CardContent>
        </Card>
      ))}
    </section>

    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>{definition.title}</CardTitle>
          <CardDescription>Core objects and states this route ships with.</CardDescription>
        </CardHeader>
        <CardContent>
          <PageItemList items={definition.mainItems} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Implementation checklist</CardTitle>
          <CardDescription>Visible states a buyer expects before customization.</CardDescription>
        </CardHeader>
        <CardContent>
          <PageItemList items={definition.asideItems} compact={true} />
        </CardContent>
      </Card>
    </section>
  </main>
);

interface ActionButtonProps {
  readonly action: SaasPageAction;
}

/**
 * Render one page action with its required leading icon.
 *
 * @param props - Button action definition.
 * @returns A styled button for one SaaS route action.
 * @example
 * <ActionButton action={definition.primaryAction} />
 */
const ActionButton = ({ action }: ActionButtonProps) => (
  <Button type="button" variant={action.variant}>
    <SaasIcon name={action.icon} />
    {action.label}
  </Button>
);

interface MetricIconProps {
  readonly name: SaasIconName;
}

/**
 * Render the metric icon used by dashboard stat cards.
 *
 * @param props - Icon key from the route definition.
 * @returns A muted icon badge for the metric card.
 * @example
 * <MetricIcon name="activity" />
 */
const MetricIcon = ({ name }: MetricIconProps) => (
  <div className="rounded-md bg-muted p-2 text-muted-foreground">
    <SaasIcon name={name} />
  </div>
);

interface PageItemListProps {
  readonly items: readonly SaasPageItem[];
  readonly compact?: boolean;
}

/**
 * Render a separated list of route objects or implementation checks.
 *
 * @param props - Items to render and whether the compact layout should be used.
 * @returns A list of page items with descriptions and metadata.
 * @example
 * <PageItemList items={definition.mainItems} />
 */
const PageItemList = ({ items, compact = false }: PageItemListProps) => (
  <div className="space-y-4">
    {items.map((item, index) => (
      <div className="space-y-4" key={item.title}>
        {index > 0 ? <Separator /> : null}
        <div className={compact ? 'space-y-2' : 'grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]'}>
          <div className="space-y-1">
            <h2 className="font-medium text-base">{item.title}</h2>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </div>
          <Badge variant="outline" className="h-fit w-fit">
            {item.meta}
          </Badge>
        </div>
      </div>
    ))}
  </div>
);
