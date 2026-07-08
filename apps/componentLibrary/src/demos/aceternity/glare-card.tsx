'use client';

import { GlareCard } from '@/components/aceternity/glare-card';

export default function GlareCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <GlareCard>
        <span className="text-sm text-muted-foreground">Preview</span>
      </GlareCard>
    </div>
  );
}
