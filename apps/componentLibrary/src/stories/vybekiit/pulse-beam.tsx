'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { PulseBeam } from '@vybekiit/ui/pulse-beam';

const COLORS = ['green', 'orange', 'red', 'blue', 'purple'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

/** All 5 PulseBeam colors and all 3 sizes, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">Colors (md)</span>
        <div className="flex items-center gap-8">
          {COLORS.map((color) => (
            <div key={color} className="flex flex-col items-center gap-2">
              <PulseBeam color={color} size="md" />
              <span className="font-medium text-muted-foreground text-xs capitalize">{color}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">Sizes (green)</span>
        <div className="flex items-end gap-8">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <PulseBeam color="green" size={size} />
              <span className="font-medium text-muted-foreground text-xs uppercase">{size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export default story;
