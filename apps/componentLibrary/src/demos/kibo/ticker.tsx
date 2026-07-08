'use client';

import { Ticker } from '@/components/kibo/ticker/index';

export default function TickerPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Ticker>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Ticker>
    </div>
  );
}
