'use client';

import { useGanttDragging } from '@/components/kibo/gantt/index';

export default function GanttPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <useGanttDragging>
        <span className="text-sm text-muted-foreground">Preview</span>
      </useGanttDragging>
    </div>
  );
}
