'use client';

import { PixelatedCanvas } from '@/components/aceternity/pixelated-canvas';

export default function PixelatedCanvasPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <PixelatedCanvas />
    </div>
  );
}
