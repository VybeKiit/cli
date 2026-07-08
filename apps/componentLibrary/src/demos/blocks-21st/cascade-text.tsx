'use client';

import { TextReveal } from '@/components/blocks/21st/cascade-text';

export default function CascadeTextPreview() {
  return (
    <div className="flex min-h-[240px] items-center justify-center p-8">
      <TextReveal className="text-4xl font-bold tracking-tight" text="Cascade reveal" />
    </div>
  );
}
