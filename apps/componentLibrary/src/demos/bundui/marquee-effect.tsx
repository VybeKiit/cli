'use client';

import { MarqueeEffect } from '@/components/bundui/marquee-effect';

export default function MarqueeEffectPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <MarqueeEffect>
        <span className="text-sm text-muted-foreground">Preview</span>
      </MarqueeEffect>
    </div>
  );
}
