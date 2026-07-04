'use client';

import { CometCard } from '@/components/aceternity/comet-card';

export default function CometCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <CometCard>
        <span className="text-sm text-muted-foreground">Preview</span>
      </CometCard>
    </div>
  );
}
