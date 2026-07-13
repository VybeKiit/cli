'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { AspectRatio } from '@vybekiit/ui/aspect-ratio';

const RATIOS: readonly { label: string; ratio: number }[] = [
  { label: '16 / 9', ratio: 16 / 9 },
  { label: '1 / 1', ratio: 1 },
];

/** AspectRatio at 16/9 and 1/1 — each wraps a gradient div with a centred caption. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-start gap-6">
      {RATIOS.map(({ label, ratio }) => (
        <div className="flex flex-col gap-2" key={label}>
          <span className="font-medium text-muted-foreground text-xs">{label}</span>
          <div className="w-56 overflow-hidden rounded-md">
            <AspectRatio ratio={ratio}>
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/5">
                <span className="font-medium text-primary/70 text-sm">{label}</span>
              </div>
            </AspectRatio>
          </div>
        </div>
      ))}
    </div>
  ),
};

export default story;
