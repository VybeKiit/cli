'use client';

import { Connection } from '@/components/ai-elements/connection';

export default function ConnectionPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Connection />
    </div>
  );
}
