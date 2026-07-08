'use client';

import { AuroraBackground } from '@/components/aceternity/aurora-background';

export default function AuroraBackgroundPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <AuroraBackground>
        <span className="text-sm text-muted-foreground">Preview</span>
      </AuroraBackground>
    </div>
  );
}
