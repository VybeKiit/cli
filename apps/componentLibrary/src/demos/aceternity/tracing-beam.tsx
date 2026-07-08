'use client';

import { TracingBeam } from '@/components/aceternity/tracing-beam';

export default function TracingBeamPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <TracingBeam>
        <span className="text-sm text-muted-foreground">Preview</span>
      </TracingBeam>
    </div>
  );
}
