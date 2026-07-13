'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { ToggleGroup, ToggleGroupItem } from '@vybekiit/ui/toggle-group';
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { useState } from 'react';

/** Single-select alignment group and multi-select formatting group. */
const Groups = () => {
  const [align, setAlign] = useState<string>('left');
  const [format, setFormat] = useState<string[]>(['bold']);

  return (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Single-select — alignment
        </span>
        <ToggleGroup
          type="single"
          value={align}
          onValueChange={(v) => {
            if (v) setAlign(v);
          }}
          aria-label="Text alignment"
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <span className="text-muted-foreground text-xs">Selected: {align}</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Multi-select — formatting
        </span>
        <ToggleGroup
          type="multiple"
          value={format}
          onValueChange={setFormat}
          aria-label="Text formatting"
        >
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <span className="text-muted-foreground text-xs">
          Selected: {format.length > 0 ? format.join(', ') : 'none'}
        </span>
      </div>
    </div>
  );
};

/** Single-select (alignment) and multi-select (formatting) ToggleGroup variants. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => <Groups />,
};

export default story;
