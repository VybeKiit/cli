'use client';

import { CanvasText } from '@/components/aceternity/canvas-text';

export default function CanvasTextPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <CanvasText />
    </div>
  );
}
