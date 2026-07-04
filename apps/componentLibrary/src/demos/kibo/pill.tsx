'use client';

import { Pill } from '@/components/kibo/pill/index';

export default function PillPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Pill>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Pill>
    </div>
  );
}
