'use client';

import { BackgroundBeamsWithCollision } from '@/components/aceternity/background-beams-with-collision';

export default function BackgroundBeamsWithCollisionPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <BackgroundBeamsWithCollision>
        <span className="text-sm text-muted-foreground">Preview</span>
      </BackgroundBeamsWithCollision>
    </div>
  );
}
