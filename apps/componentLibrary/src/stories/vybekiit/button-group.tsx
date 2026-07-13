'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@vybekiit/ui/button-group';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

/** Two ButtonGroup compositions: a 3-button alignment group and a mixed text + separator group. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-8">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          3-button group
        </span>
        <ButtonGroup>
          <Button aria-label="Align left" size="icon" variant="outline">
            <AlignLeft />
          </Button>
          <Button aria-label="Align center" size="icon" variant="outline">
            <AlignCenter />
          </Button>
          <Button aria-label="Align right" size="icon" variant="outline">
            <AlignRight />
          </Button>
        </ButtonGroup>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Text + separator + buttons
        </span>
        <ButtonGroup>
          <ButtonGroupText>Sort by</ButtonGroupText>
          <ButtonGroupSeparator />
          <Button size="sm" variant="outline">
            Name
          </Button>
          <Button size="sm" variant="outline">
            Date
          </Button>
          <Button size="sm" variant="outline">
            Size
          </Button>
        </ButtonGroup>
      </div>
    </div>
  ),
};

export default story;
