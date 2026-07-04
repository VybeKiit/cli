'use client';

import { DraggableCardBody } from '@/components/aceternity/draggable-card';

export default function DraggableCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <DraggableCardBody />
    </div>
  );
}
