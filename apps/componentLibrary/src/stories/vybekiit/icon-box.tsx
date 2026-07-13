'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { IconBox } from '@vybekiit/ui/icon-box';
import { Sparkles } from 'lucide-react';

const SIZES = ['sm', 'default', 'md', 'lg'] as const;
const SHAPES = ['rounded', 'circle'] as const;

/** IconBox across all size and shape variants, each containing a Sparkles icon. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Sizes (shape: rounded)
        </span>
        <div className="flex flex-wrap items-end gap-4">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <IconBox size={size}>
                <Sparkles />
              </IconBox>
              <span className="text-muted-foreground text-xs">{size}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Shapes (size: default)
        </span>
        <div className="flex flex-wrap items-end gap-4">
          {SHAPES.map((shape) => (
            <div key={shape} className="flex flex-col items-center gap-1.5">
              <IconBox shape={shape}>
                <Sparkles />
              </IconBox>
              <span className="text-muted-foreground text-xs">{shape}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export default story;
