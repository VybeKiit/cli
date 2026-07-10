'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  GripVertical,
  Layers,
  UserRound,
} from 'lucide-react';
import { type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type StageId = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won';

/** One pipeline deal card. Value is integer cents (mirrors deals.value_cents). */
type Deal = {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly owner: string;
  readonly valueCents: number;
  readonly stage: StageId;
  readonly closeDate: string;
};

const STAGES: readonly {
  readonly id: StageId;
  readonly label: string;
  readonly tone: string;
}[] = [
  { id: 'lead', label: 'Lead', tone: 'border-t-slate-400' },
  { id: 'qualified', label: 'Qualified', tone: 'border-t-blue-500' },
  { id: 'proposal', label: 'Proposal', tone: 'border-t-violet-500' },
  { id: 'negotiation', label: 'Negotiation', tone: 'border-t-amber-500' },
  { id: 'won', label: 'Won', tone: 'border-t-emerald-500' },
];

const STAGE_INDEX: Record<StageId, number> = {
  lead: 0,
  qualified: 1,
  proposal: 2,
  negotiation: 3,
  won: 4,
};

/** Realistic multi-deal seed across every stage. */
const INITIAL_DEALS: readonly Deal[] = [
  {
    id: 'deal_01',
    title: 'Northwind SSO expand',
    company: 'Northwind Labs',
    owner: 'Maya Chen',
    valueCents: 4_800_000,
    stage: 'negotiation',
    closeDate: 'Jul 22',
  },
  {
    id: 'deal_02',
    title: 'Orbit Health trial → paid',
    company: 'Orbit Health',
    owner: 'Sam Ortiz',
    valueCents: 1_490_000,
    stage: 'proposal',
    closeDate: 'Jul 18',
  },
  {
    id: 'deal_03',
    title: 'Lumen annual renew',
    company: 'Lumen GmbH',
    owner: 'Maya Chen',
    valueCents: 2_990_000,
    stage: 'qualified',
    closeDate: 'Aug 1',
  },
  {
    id: 'deal_04',
    title: 'Canvas Studio starter',
    company: 'Canvas Studio',
    owner: 'Lee Park',
    valueCents: 290_000,
    stage: 'lead',
    closeDate: 'Jul 30',
  },
  {
    id: 'deal_05',
    title: 'Harbor Freight seats +5',
    company: 'Harbor Freight SaaS',
    owner: 'Lee Park',
    valueCents: 750_000,
    stage: 'proposal',
    closeDate: 'Jul 25',
  },
  {
    id: 'deal_06',
    title: 'Summit Retail scale',
    company: 'Summit Retail',
    owner: 'Sam Ortiz',
    valueCents: 9_900_000,
    stage: 'negotiation',
    closeDate: 'Aug 8',
  },
  {
    id: 'deal_07',
    title: 'Pixel Forge pilot',
    company: 'Pixel Forge',
    owner: 'Maya Chen',
    valueCents: 490_000,
    stage: 'lead',
    closeDate: 'Aug 12',
  },
  {
    id: 'deal_08',
    title: 'Fieldkit winback',
    company: 'Fieldkit',
    owner: 'Sam Ortiz',
    valueCents: 990_000,
    stage: 'qualified',
    closeDate: 'Jul 28',
  },
  {
    id: 'deal_09',
    title: 'Acme closed won Q2',
    company: 'Acme Co',
    owner: 'Lee Park',
    valueCents: 3_600_000,
    stage: 'won',
    closeDate: 'Jun 30',
  },
];

const usd = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);

/**
 * A production-shaped sales pipeline board: kanban columns by stage, live deal counts and
 * pipeline value, keyboard-friendly move buttons, and HTML5 drag-and-drop between stages.
 * Empty columns show a real empty state. Plug-in panel maps onto the pipeline preset.
 *
 * @returns The pipeline recipe element.
 * @example
 * const element = <PipelinePage />;
 */
export const PipelinePage = () => {
  // TODO: Load pipeline stages and deals from the pipeline preset tables.
  // TODO: Persist deal stage moves through PATCH /api/deals/:id.
  const boardLabelId = useId();
  const [deals, setDeals] = useState<readonly Deal[]>(INITIAL_DEALS);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<StageId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const totals = useMemo(() => {
    const open = deals.filter((deal) => deal.stage !== 'won');
    const value = open.reduce((sum, deal) => sum + deal.valueCents, 0);
    return { dealCount: deals.length, openCount: open.length, value };
  }, [deals]);

  const byStage = useMemo(() => {
    const map: Record<StageId, Deal[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      won: [],
    };
    for (const deal of deals) {
      map[deal.stage].push(deal);
    }
    return map;
  }, [deals]);

  const moveDeal = (dealId: string, stage: StageId) => {
    setDeals((current) => current.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal)));
    const stageLabel = STAGES.find((s) => s.id === stage)?.label ?? stage;
    setNotice(`Moved deal to ${stageLabel}.`);
  };

  const nudge = (dealId: string, direction: -1 | 1) => {
    const deal = deals.find((item) => item.id === dealId);
    if (deal === undefined) {
      return;
    }
    const nextIndex = STAGE_INDEX[deal.stage] + direction;
    if (nextIndex < 0 || nextIndex >= STAGES.length) {
      return;
    }
    const nextStage = STAGES[nextIndex]?.id;
    if (nextStage !== undefined) {
      moveDeal(dealId, nextStage);
    }
  };

  const onDrop = (stage: StageId) => {
    if (draggingId !== null) {
      moveDeal(draggingId, stage);
    }
    setDraggingId(null);
    setDropStage(null);
  };

  return (
    <Frame>
      <main className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              CRM
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl" id={boardLabelId}>
              Pipeline
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Drag a card between stages or use the arrow buttons. Counts and pipeline value update
              live.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Kpi
              icon={<Layers aria-hidden="true" className="h-4 w-4" />}
              label="Deals"
              value={String(totals.dealCount)}
            />
            <Kpi
              icon={<CircleDollarSign aria-hidden="true" className="h-4 w-4" />}
              label="Open value"
              value={usd(totals.value)}
            />
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div
          aria-labelledby={boardLabelId}
          className="flex gap-3 overflow-x-auto pb-4"
          role="region"
        >
          {STAGES.map((stage) => {
            const columnDeals = byStage[stage.id];
            const columnValue = columnDeals.reduce((sum, deal) => sum + deal.valueCents, 0);
            const isDropTarget = dropStage === stage.id;
            return (
              <section
                aria-label={`${stage.label} stage, ${columnDeals.length} deals`}
                className={cn(
                  'flex w-72 shrink-0 flex-col rounded-xl border border-t-4 bg-muted/30',
                  stage.tone,
                  isDropTarget && 'ring-2 ring-primary ring-offset-2',
                )}
                key={stage.id}
                onDragLeave={() =>
                  setDropStage((current) => (current === stage.id ? null : current))
                }
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropStage(stage.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  onDrop(stage.id);
                }}
              >
                <header className="flex items-center justify-between gap-2 px-3 py-3">
                  <div>
                    <h2 className="font-semibold text-sm">{stage.label}</h2>
                    <p className="text-muted-foreground text-xs">
                      {columnDeals.length} · {usd(columnValue)}
                    </p>
                  </div>
                  <Badge variant="secondary">{columnDeals.length}</Badge>
                </header>
                <ul className="flex min-h-[120px] flex-1 flex-col gap-2 px-2 pb-3">
                  {columnDeals.length === 0 ? (
                    <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-background/50 px-3 py-8 text-center text-muted-foreground text-xs">
                      Drop a deal here
                    </li>
                  ) : (
                    columnDeals.map((deal) => (
                      <li key={deal.id}>
                        <DealCard
                          deal={deal}
                          dragging={draggingId === deal.id}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDropStage(null);
                          }}
                          onDragStart={() => setDraggingId(deal.id)}
                          onNudgeLeft={() => nudge(deal.id, -1)}
                          onNudgeRight={() => nudge(deal.id, 1)}
                          stageIndex={STAGE_INDEX[deal.stage]}
                          stageCount={STAGES.length}
                        />
                      </li>
                    ))
                  )}
                </ul>
              </section>
            );
          })}
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — drag or arrow-move a deal and the stage counts
              recompute. Empty columns show a drop target. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset pipeline</code> for <code>deal_stages</code>,{' '}
                <code>deals</code>, and <code>deal_activities</code>.
              </li>
              <li>
                Seed stages once, then <code>GET /api/deals</code> grouped by <code>stage_id</code>{' '}
                (value in integer cents).
              </li>
              <li>
                On drop / arrow move, <code>PATCH /api/deals/:id</code> with{' '}
                <code>{'{ stageId }'}</code> and write a <code>deal_activities</code> row of kind{' '}
                <code>stage_change</code>.
              </li>
              <li>
                Optionally link <code>customer_id</code> to the customers preset so cards open the
                customer detail recipe.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper (matches the other recipes). */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="slide" title="Pipeline motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** Compact header KPI chip. */
const Kpi = ({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) => (
  <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
    <span className="text-muted-foreground">{icon}</span>
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold tabular-nums text-sm">{value}</p>
    </div>
  </div>
);

/** One draggable deal card with keyboard move controls. */
const DealCard = ({
  deal,
  dragging,
  onDragStart,
  onDragEnd,
  onNudgeLeft,
  onNudgeRight,
  stageIndex,
  stageCount,
}: {
  readonly deal: Deal;
  readonly dragging: boolean;
  readonly onDragStart: () => void;
  readonly onDragEnd: () => void;
  readonly onNudgeLeft: () => void;
  readonly onNudgeRight: () => void;
  readonly stageIndex: number;
  readonly stageCount: number;
}) => (
  <Card
    className={cn(
      'cursor-grab active:cursor-grabbing',
      dragging && 'opacity-50 ring-2 ring-primary',
    )}
    draggable={true}
    onDragEnd={onDragEnd}
    onDragStart={(event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', deal.id);
      onDragStart();
    }}
  >
    <CardHeader className="space-y-1 p-3 pb-1">
      <div className="flex items-start gap-1">
        <GripVertical
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        />
        <CardTitle className="text-sm leading-snug">{deal.title}</CardTitle>
      </div>
      <p className="pl-5 text-muted-foreground text-xs">{deal.company}</p>
    </CardHeader>
    <CardContent className="space-y-2 p-3 pt-1">
      <div className="flex items-center justify-between gap-2 pl-5 text-xs">
        <span className="font-semibold tabular-nums">{usd(deal.valueCents)}</span>
        <span className="text-muted-foreground">Close {deal.closeDate}</span>
      </div>
      <div className="flex items-center justify-between gap-2 pl-5">
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <UserRound aria-hidden="true" className="h-3 w-3" />
          {deal.owner}
        </span>
        <div className="flex gap-1">
          <Button
            aria-label={`Move ${deal.title} to previous stage`}
            disabled={stageIndex === 0}
            onClick={onNudgeLeft}
            size="icon"
            type="button"
            variant="ghost"
            className="h-7 w-7"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
          <Button
            aria-label={`Move ${deal.title} to next stage`}
            disabled={stageIndex >= stageCount - 1}
            onClick={onNudgeRight}
            size="icon"
            type="button"
            variant="ghost"
            className="h-7 w-7"
          >
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);
