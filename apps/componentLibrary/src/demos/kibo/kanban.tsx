'use client';

import { KanbanBoard } from '@/components/kibo/kanban/index';

export default function KanbanPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <KanbanBoard>
        <span className="text-sm text-muted-foreground">Preview</span>
      </KanbanBoard>
    </div>
  );
}
