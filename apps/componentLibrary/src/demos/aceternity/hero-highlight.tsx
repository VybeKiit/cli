'use client';

import { HeroHighlight } from '@/components/aceternity/hero-highlight';

export default function HeroHighlightPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <HeroHighlight>
        <span className="text-sm text-muted-foreground">Preview</span>
      </HeroHighlight>
    </div>
  );
}
