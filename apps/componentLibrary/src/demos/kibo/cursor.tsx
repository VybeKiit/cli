'use client';

import { Cursor } from '@/components/kibo/cursor/index';

export default function CursorPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Cursor />
    </div>
  );
}
