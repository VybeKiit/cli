'use client';

import { MovingBorder } from '@/components/aceternity/moving-border';

export default function MovingBorderPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <MovingBorder>
        <span className="text-sm text-muted-foreground">Preview</span>
      </MovingBorder>
    </div>
  );
}
