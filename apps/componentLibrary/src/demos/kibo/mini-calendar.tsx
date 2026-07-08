'use client';

import { MiniCalendar } from '@/components/kibo/mini-calendar/index';

export default function MiniCalendarPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <MiniCalendar />
    </div>
  );
}
