'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@vybekiit/ui/button';
import { Calendar } from '@vybekiit/ui/calendar';
import { Popover, PopoverPopup, PopoverTrigger } from '@vybekiit/ui/popover';

export default function Particle() {
  const [date, setDate] = useState<Date | undefined>();

  return (
    <Popover>
      <PopoverTrigger render={<Button className="w-full justify-start" variant="outline" />}>
        <CalendarIcon aria-hidden="true" />
        {date ? format(date, 'PPP') : 'Pick a date'}
      </PopoverTrigger>
      <PopoverPopup>
        <Calendar defaultMonth={date} mode="single" onSelect={setDate} selected={date} />
      </PopoverPopup>
    </Popover>
  );
}
