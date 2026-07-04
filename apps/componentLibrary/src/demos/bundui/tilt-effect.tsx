'use client';

import { TiltEffect } from '@/components/bundui/tilt-effect';

export default function TiltEffectPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <TiltEffect>
        <span className="text-sm text-muted-foreground">Preview</span>
      </TiltEffect>
    </div>
  );
}
