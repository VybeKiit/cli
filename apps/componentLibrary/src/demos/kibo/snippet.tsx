'use client';

import { Snippet } from '@/components/kibo/snippet/index';

export default function SnippetPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Snippet />
    </div>
  );
}
