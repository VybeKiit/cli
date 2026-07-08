'use client';

import { FloatingPathsBackground } from '@/components/bundui/floating-paths';

export default function FloatingPathsPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <FloatingPathsBackground>
        <span className="text-sm text-muted-foreground">Preview</span>
      </FloatingPathsBackground>
    </div>
  );
}
