'use client';

import { BuilderAssistantMark } from '@/components/builder-assistant-mark';

export default function BuilderAssistantCodexPreview() {
  return (
    <div className="flex min-h-[280px] items-center justify-center bg-muted/20 p-10">
      <BuilderAssistantMark assistant="codex" size="xxl" />
    </div>
  );
}
