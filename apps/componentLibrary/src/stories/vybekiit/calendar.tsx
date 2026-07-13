'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Calendar } from '@vybekiit/ui/calendar';
import { useState } from 'react';

/** Single-date Calendar with controlled selection; today pre-selected. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    return (
      <div className="flex flex-col items-start gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Single selection
          </span>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>
        <div className="text-muted-foreground text-xs">
          Selected:{' '}
          <span className="font-medium text-foreground">
            {date ? date.toLocaleDateString() : 'none'}
          </span>
        </div>
      </div>
    );
  },
};

export default story;
