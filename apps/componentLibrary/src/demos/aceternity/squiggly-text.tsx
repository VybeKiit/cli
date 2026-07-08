'use client';

import { SquigglyText } from '@/components/aceternity/squiggly-text';

export default function SquigglyTextPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <SquigglyText>
        <span className="text-sm text-muted-foreground">Preview</span>
      </SquigglyText>
    </div>
  );
}
