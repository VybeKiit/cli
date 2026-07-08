'use client';

import { StarsBackground } from '@/components/bundui/stars';

export default function StarsPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <StarsBackground />
    </div>
  );
}
