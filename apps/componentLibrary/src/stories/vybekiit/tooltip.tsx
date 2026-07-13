'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@vybekiit/ui/tooltip';

/** Real, hoverable/focusable Tooltips on two sides. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-6">
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>Ships with sensible defaults</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild={true}>
            <Button variant="outline">Focus me</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Keyboard users get it too</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export default story;
