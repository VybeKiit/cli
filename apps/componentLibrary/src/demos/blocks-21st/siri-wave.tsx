'use client';

import { SiriWave } from '@/components/blocks/21st/siri-wave';

export default function SiriWavePreview() {
  return (
    <div className="flex min-h-[240px] items-center justify-center bg-black p-6">
      <SiriWave className="h-24 w-full max-w-md" />
    </div>
  );
}
