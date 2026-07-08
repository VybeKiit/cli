'use client';

import { Canvas } from '@/components/ai-elements/canvas';

export default function CanvasPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Canvas />
    </div>
  );
}
