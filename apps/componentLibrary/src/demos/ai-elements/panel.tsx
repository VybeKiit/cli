'use client';

import { Panel } from '@/components/ai-elements/panel';

export default function PanelPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Panel />
    </div>
  );
}
