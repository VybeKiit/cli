'use client';

import { PointerHighlight } from '@/components/aceternity/pointer-highlight';

export default function PointerHighlightPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <PointerHighlight>
        <span className="text-sm text-muted-foreground">Preview</span>
      </PointerHighlight>
    </div>
  );
}
