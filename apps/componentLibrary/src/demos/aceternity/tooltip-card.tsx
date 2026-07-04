'use client';

import { Tooltip } from '@/components/aceternity/tooltip-card';

export default function TooltipCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Tooltip>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Tooltip>
    </div>
  );
}
