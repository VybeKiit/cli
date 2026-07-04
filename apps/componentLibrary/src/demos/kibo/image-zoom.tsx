'use client';

import { ImageZoom } from '@/components/kibo/image-zoom/index';

export default function ImageZoomPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ImageZoom />
    </div>
  );
}
