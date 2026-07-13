'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { ScrollArea } from '@vybekiit/ui/scroll-area';

const TAGS = Array.from({ length: 25 }, (_, i) => `v1.${i}.0`);

/** ScrollArea with a 25-item list — tall enough to actually scroll vertically. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col items-start gap-2">
      <span className="font-medium text-muted-foreground text-xs">Vertical scroll</span>
      <ScrollArea className="h-48 w-64 rounded-md border">
        <div className="p-4">
          <h4 className="mb-4 font-medium text-sm leading-none">Tags</h4>
          {TAGS.map((tag) => (
            <div key={tag}>
              <div className="py-1 text-sm">{tag}</div>
              <div className="h-px bg-border last:hidden" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

export default story;
