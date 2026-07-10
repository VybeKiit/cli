import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AI_OPERATOR_CARD } from '@/data/visitorLanding';
import { cn } from '@/lib/utils';

/**
 * Hero right-rail card — AI operator checklist ending in “live”.
 *
 * @returns The rendered AI operator card.
 * @example
 * <AiOperatorCard />
 */
export const AiOperatorCard = () => (
  <Card className="border-border/80 shadow-sm">
    <CardHeader className="pb-3">
      <CardTitle className="font-semibold text-base">{AI_OPERATOR_CARD.title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <ul className="space-y-2">
        {AI_OPERATOR_CARD.steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm',
              step.highlight
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-border bg-background text-foreground',
            )}
          >
            <span className="font-medium">{step.label}</span>
            <Check
              aria-hidden={true}
              className={cn('size-4 shrink-0', step.highlight ? 'text-white' : 'text-blue-600')}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-muted-foreground text-sm">
        <span
          aria-hidden={true}
          className="inline-flex size-5 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 text-xs"
        >
          ●
        </span>
        {AI_OPERATOR_CARD.liveUrlLabel}
      </div>
    </CardContent>
  </Card>
);
