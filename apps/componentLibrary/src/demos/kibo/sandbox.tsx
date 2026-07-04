'use client';

import { SandboxProvider } from '@/components/kibo/sandbox/index';

export default function SandboxPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <SandboxProvider />
    </div>
  );
}
