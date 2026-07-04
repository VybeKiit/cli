'use client';

import { LinkPreview } from '@/components/aceternity/link-preview';

export default function LinkPreviewPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <LinkPreview>
        <span className="text-sm text-muted-foreground">Preview</span>
      </LinkPreview>
    </div>
  );
}
