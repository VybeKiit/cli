'use client';

import { MagneticButton } from '@/components/aceternity/magnetic-button';

export default function MagneticButtonPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <MagneticButton>
        <span className="text-sm text-muted-foreground">Preview</span>
      </MagneticButton>
    </div>
  );
}
