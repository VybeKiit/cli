'use client';

import { MouseTrail } from '@/components/bundui/mouse-trail';

export default function MouseTrailPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <MouseTrail />
    </div>
  );
}
