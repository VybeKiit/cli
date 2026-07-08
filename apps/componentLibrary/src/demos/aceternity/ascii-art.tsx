'use client';

import { AsciiArt } from '@/components/aceternity/ascii-art';

export default function AsciiArtPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <AsciiArt />
    </div>
  );
}
