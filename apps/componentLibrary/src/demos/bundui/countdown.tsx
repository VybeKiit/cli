'use client';

import { Countdown } from '@/components/bundui/countdown';

export default function CountdownPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Countdown />
    </div>
  );
}
