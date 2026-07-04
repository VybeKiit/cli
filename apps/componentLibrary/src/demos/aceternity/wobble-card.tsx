'use client';

import { WobbleCard } from '@/components/aceternity/wobble-card';

export default function WobbleCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <WobbleCard>
        <span className="text-sm text-muted-foreground">Preview</span>
      </WobbleCard>
    </div>
  );
}
