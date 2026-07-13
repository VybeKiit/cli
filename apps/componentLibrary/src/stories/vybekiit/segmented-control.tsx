'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { useState } from 'react';

const DefaultControl = () => {
  const [value, setValue] = useState('week');

  return (
    <SegmentedControl value={value} onValueChange={setValue}>
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="month">Month</SegmentedControlItem>
    </SegmentedControl>
  );
};

const SmallControl = () => {
  const [value, setValue] = useState('all');

  return (
    <SegmentedControl size="sm" value={value} onValueChange={setValue}>
      <SegmentedControlItem value="all">All</SegmentedControlItem>
      <SegmentedControlItem value="active">Active</SegmentedControlItem>
      <SegmentedControlItem value="archived">Archived</SegmentedControlItem>
    </SegmentedControl>
  );
};

/** SegmentedControl in default and sm sizes; selection is live and interactive. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-8">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Default size
        </span>
        <DefaultControl />
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Small (sm)
        </span>
        <SmallControl />
      </div>
    </div>
  ),
};

export default story;
