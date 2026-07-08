'use client';

import { FloatingButton } from '@/components/bundui/floating-button';

export default function FloatingButtonPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <FloatingButton>
        <span className="text-sm text-muted-foreground">Preview</span>
      </FloatingButton>
    </div>
  );
}
