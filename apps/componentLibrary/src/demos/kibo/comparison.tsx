'use client';

import { Comparison } from '@/components/kibo/comparison/index';

export default function ComparisonPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Comparison />
    </div>
  );
}
