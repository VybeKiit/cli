'use client';

import { DirectionAwareHover } from '@/components/aceternity/direction-aware-hover';

export default function DirectionAwareHoverPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <DirectionAwareHover>
        <span className="text-sm text-muted-foreground">Preview</span>
      </DirectionAwareHover>
    </div>
  );
}
