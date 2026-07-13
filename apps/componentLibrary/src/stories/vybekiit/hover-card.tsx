'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@vybekiit/ui/hover-card';
import { CalendarDays } from 'lucide-react';

/** A real HoverCard — hover over the trigger link to reveal a mini profile card. */
const HoverCardDemo = () => (
  <HoverCard>
    <HoverCardTrigger asChild={true}>
      <Button variant="link">@ada_lovelace</Button>
    </HoverCardTrigger>
    <HoverCardContent className="w-72">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm">
          AL
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-sm leading-none">Ada Lovelace</p>
          <p className="text-muted-foreground text-xs">@ada_lovelace</p>
          <p className="text-sm">
            Mathematician and writer, often regarded as the first computer programmer.
          </p>
          <div className="flex items-center gap-1 pt-1 text-muted-foreground text-xs">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Joined December 1815</span>
          </div>
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
);

/** HoverCard with a link trigger — hover over the username to see the mini profile. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Default</span>
        <HoverCardDemo />
      </div>
    </div>
  ),
};

export default story;
