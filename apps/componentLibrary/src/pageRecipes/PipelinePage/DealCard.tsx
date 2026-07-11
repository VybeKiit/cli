import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { ArrowLeft, ArrowRight, GripVertical, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatUsdWholeCents } from '../shared/formatUsdCents';
import type { Deal } from './types';

/** One draggable deal card with keyboard move controls. */
export const DealCard = ({
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
        <span className="font-semibold tabular-nums">{formatUsdWholeCents(deal.valueCents)}</span>
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
