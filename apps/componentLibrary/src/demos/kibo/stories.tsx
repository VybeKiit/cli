'use client';

import { Stories } from '@/components/kibo/stories/index';

export default function StoriesPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Stories />
    </div>
  );
}
