'use client';

import Component from '@/components/bundui/animated-gradient-border/gradient-border';

export default function AnimatedGradientBorderPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Component>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Component>
    </div>
  );
}
