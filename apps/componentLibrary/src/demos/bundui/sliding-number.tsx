'use client';

import { SlidingNumber } from '@/components/bundui/sliding-number';

export default function SlidingNumberPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <SlidingNumber />
    </div>
  );
}
