'use client';

import { StickyBanner } from '@/components/aceternity/sticky-banner';

export default function StickyBannerPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <StickyBanner>
        <span className="text-sm text-muted-foreground">Preview</span>
      </StickyBanner>
    </div>
  );
}
