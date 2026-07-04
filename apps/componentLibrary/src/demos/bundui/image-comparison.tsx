'use client';

import { ImageComparison } from '@/components/bundui/image-comparison';

export default function ImageComparisonPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ImageComparison>
        <span className="text-sm text-muted-foreground">Preview</span>
      </ImageComparison>
    </div>
  );
}
