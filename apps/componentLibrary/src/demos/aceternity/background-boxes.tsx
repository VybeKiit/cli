'use client';

import { Boxes, BoxesCore } from '@/components/aceternity/ui/background-boxes';

export default function BackgroundBoxesPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <BoxesCore />
      <Boxes />
    </div>
  );
}
