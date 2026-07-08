'use client';

import {
  ProgressBar,
  ProgressBarBase,
} from '@/components/untitled/progress-indicators/progress-indicators';

export default function ProgressIndicatorsPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <ProgressBarBase />
      <ProgressBar />
    </div>
  );
}
