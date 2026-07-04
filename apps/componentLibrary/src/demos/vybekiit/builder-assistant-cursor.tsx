'use client';

import { BuilderAssistantMark } from '@/components/builder-assistant-mark';

export default function BuilderAssistantCursorPreview() {
  return (
    <div className="flex min-h-[280px] items-center justify-center bg-muted/20 p-10">
      <BuilderAssistantMark assistant="cursor" size="xxl" />
    </div>
  );
}
