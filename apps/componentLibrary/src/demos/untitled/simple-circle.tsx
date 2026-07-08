'use client';

import { CircleProgressBar } from '@/components/untitled/progress-indicators/simple-circle';

export default function SimpleCirclePreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <CircleProgressBar />
    </div>
  );
}
