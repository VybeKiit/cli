'use client';

import { HintText } from '@/components/untitled/input/hint-text';

export default function HintTextPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <HintText>
        <span className="text-sm text-muted-foreground">Preview</span>
      </HintText>
    </div>
  );
}
