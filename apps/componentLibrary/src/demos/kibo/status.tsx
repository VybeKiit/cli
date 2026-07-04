'use client';

import { Status } from '@/components/kibo/status/index';

export default function StatusPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Status />
    </div>
  );
}
