'use client';

import { TreeProvider } from '@/components/kibo/tree/index';

export default function TreePreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <TreeProvider>
        <span className="text-sm text-muted-foreground">Preview</span>
      </TreeProvider>
    </div>
  );
}
