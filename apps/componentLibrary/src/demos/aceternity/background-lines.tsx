'use client';

import { BackgroundLines } from '@/components/aceternity/background-lines';

export default function BackgroundLinesPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <BackgroundLines>
        <span className="text-sm text-muted-foreground">Preview</span>
      </BackgroundLines>
    </div>
  );
}
