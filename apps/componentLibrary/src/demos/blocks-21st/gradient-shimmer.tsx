'use client';

import { GradientShimmer } from '@/components/blocks/21st/gradient-shimmer';

export default function GradientShimmerPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-8">
      <GradientShimmer className="text-4xl font-bold tracking-tight">Shimmer text</GradientShimmer>
    </div>
  );
}
