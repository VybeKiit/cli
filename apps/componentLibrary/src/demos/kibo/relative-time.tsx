'use client';

import { RelativeTime } from '@/components/kibo/relative-time/index';

export default function RelativeTimePreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <RelativeTime />
    </div>
  );
}
